// Live redirect audit (GET, manual redirect following). Usage: node redirects/audit.mjs [outDir]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.argv[2] ?? here;
const UA = "Mozilla/5.0 (redirect-audit)";
const MOBILE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const ADSBOT = "AdsBot-Google (+http://www.google.com/adsbot.html)";
const GBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const csv = (file) => {
  const [head, ...rows] = readFileSync(file, "utf8").replace(/\r/g, "").trim().split("\n");
  const keys = head.split(",");
  return rows.map((r) => Object.fromEntries(r.split(",").map((v, i) => [keys[i], v])));
};

const cases = [];
const add = (url, variant, expected = "", ua = UA) => cases.push({ url, variant, expected, ua });

const cabo = csv(`${here}/redirects-map.csv`);
const pcFile = `${here}/pharmacycabo-map.csv`;
const pc = existsSync(pcFile) ? csv(pcFile) : [];
for (const r of cabo) add(r.url_vieja, "inventario", r.destino);
for (const r of pc) add(r.url_vieja, "inventario", r.destino);

// protocol / host variants
const pick = [cabo.filter((r) => ["home", "page", "post", "product", "category", "product_cat"].includes(r.tipo)).filter((_, i) => i % 40 === 0), pc.slice(0, 6)].flat();
for (const r of [cabo[0], { url_vieja: "https://www.pharmacycabo.com/", destino: "https://www.rmcpharmacy.com/" }, ...pick]) {
  const u = new URL(r.url_vieja);
  const bare = u.host.replace(/^www\./, "");
  const rest = u.pathname + u.search;
  add(`http://${bare}${rest}`, "http sin www", r.destino);
  add(`https://${bare}${rest}`, "https sin www", r.destino);
  add(`http://www.${bare}${rest}`, "http www", r.destino);
}

// attribution parameters, legacy query URLs, edge paths, user agents
const Q = "utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=TEST123&gbraid=B1&wbraid=W1&fbclid=F1&msclkid=M1";
for (const [d, paths] of [
  ["www.cabopharmacy.com", ["/", "/delivery/", "/pharmacy-delivery/", "/contact/", "/es/"]],
  ["www.pharmacycabo.com", ["/", "/en/delivery/", "/es/", "/es/iv-therapy/"]],
]) for (const p of paths) add(`https://${d}${p}?${Q}`, "parametros");
add(`http://cabopharmacy.com/delivery/?${Q}`, "parametros http sin www");
add(`http://pharmacycabo.com/en/delivery/?${Q}`, "parametros http sin www");
for (const d of ["www.cabopharmacy.com", "www.pharmacycabo.com"]) {
  for (const p of ["/?p=466", "/?p=467", "/?s=ibuprofen", "/?add-to-cart=123", "/index.html", "/index.php", "/DELIVERY/", "/delivery//", "/no-existe-xyz/", "/wp-login.php", "/wp-admin/", "/xmlrpc.php", "/wp-content/uploads/2020/01/x.jpg", "/favicon.ico", "/ads.txt", "/sitemap_index.xml", "/.well-known/security.txt", "/robots.txt", "/sitemap.xml"]) add(`https://${d}${p}`, "borde");
  for (const [n, ua] of [["movil", MOBILE], ["AdsBot", ADSBOT], ["Googlebot", GBOT]]) add(`https://${d}/delivery/`, `agente ${n}`, "", ua);
}

async function trace(c) {
  const hops = [];
  let url = c.url;
  for (let i = 0; i < 10; i++) {
    let res;
    for (let a = 0; a < 3; a++) {
      try {
        res = await fetch(url, { redirect: "manual", headers: { "user-agent": c.ua }, signal: AbortSignal.timeout(25000) });
        break;
      } catch (e) {
        if (a === 2) return { ...c, hops: [...hops, { url, status: "ERROR", location: String(e.cause?.code ?? e.message) }] };
      }
    }
    await res.body?.cancel();
    const loc = res.headers.get("location");
    hops.push({ url, status: res.status, location: loc ?? "" });
    if (!(res.status >= 300 && res.status < 400 && loc)) return { ...c, hops };
    url = new URL(loc, url).href;
    if (hops.some((h) => h.url === url)) return { ...c, hops: [...hops, { url, status: "BUCLE", location: "" }] };
  }
  return { ...c, hops };
}

const results = new Array(cases.length);
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < cases.length) { const i = next++; results[i] = await trace(cases[i]); }
}));

const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const rows = [["dominio", "variante", "url_inicial", "salto", "url_salto", "status", "location", "saltos_redireccion", "destino_final", "status_final", "destino_esperado", "resultado"]];
const summary = {};
for (const r of results) {
  const last = r.hops.at(-1);
  const n = r.hops.length - 1;
  const base = last.url.split("?")[0];
  const initial = new URL(r.url);
  const problems = [];
  if (last.status !== 200) problems.push(`final ${last.status}`);
  if (r.expected && base !== r.expected) problems.push("destino distinto");
  if (initial.search && !/add-to-cart|[?&]p=|[?&]s=/.test(initial.search) && !last.url.includes("gclid=TEST123") && initial.search.includes("gclid")) problems.push("parametros perdidos");
  if (r.hops.slice(0, -1).some((h) => ![301, 308].includes(h.status))) problems.push("redireccion no permanente");
  if (n > 1) problems.push(`cadena ${n} saltos`);
  const result = problems.length ? problems.join("; ") : "OK";
  const dom = initial.host.replace(/^www\./, "");
  const key = `${dom} | ${r.variant} | ${result}`;
  summary[key] = (summary[key] ?? 0) + 1;
  r.hops.forEach((h, i) => rows.push([dom, r.variant, r.url, i + 1, h.url, h.status, h.location, n, last.url, last.status, r.expected, result]));
}
writeFileSync(`${out}/REDIRECT_MAP.csv`, rows.map((r) => r.map(q).join(",")).join("\n") + "\n");

// destination health
const dests = [...new Set(results.map((r) => r.hops.at(-1).url.split("?")[0]))];
const health = [["destino", "status", "robots_meta", "x_robots", "canonical", "lang", "ads_tag", "ga_tag"]];
for (const d of dests) {
  const res = await fetch(d, { redirect: "manual", headers: { "user-agent": UA } });
  const html = (res.headers.get("content-type") ?? "").includes("html") ? await res.text() : "";
  health.push([d, res.status, html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "", res.headers.get("x-robots-tag") ?? "", html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "", html.match(/<html[^>]*lang="([^"]*)"/)?.[1] ?? "", [...new Set(html.match(/AW-\d{6,}/g) ?? [])].join(" "), [...new Set(html.match(/(G-[A-Z0-9]{8,}|GTM-[A-Z0-9]{5,})/g) ?? [])].join(" ")]);
}
writeFileSync(`${out}/DESTINATION_HEALTH.csv`, health.map((r) => r.map(q).join(",")).join("\n") + "\n");
console.log("casos", results.length, "filas", rows.length - 1, "destinos", dests.length);
console.log(Object.entries(summary).sort().map(([k, v]) => `${v}\t${k}`).join("\n"));
console.log(health.map((r) => r.join(" | ")).join("\n"));
