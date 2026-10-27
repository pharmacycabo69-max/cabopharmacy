# Cabo Pharmacy — compliance pass (Google Ads / Meta Ads)

This repo is a **static mirror** of the WordPress site (no theme source, no WP-CLI, no database, no admin access).
All edits below were applied to the mirrored HTML. To change the live site, apply the same changes in WordPress
(steps at the bottom) or deploy this mirror.

## Placeholders to fill (search for `pic-ph`, `[RAZÓN SOCIAL]`)

| Placeholder | Where |
|---|---|
| `[RAZÓN SOCIAL]` | footer (all pages), /about/, /privacy-policy/, /terms-of-service/, home JSON-LD `legalName` |
| `[DIRECCIÓN FÍSICA COMPLETA]` | footer, /about/, home JSON-LD `streetAddress` |
| `[NÚMERO DE LICENCIA / AVISO]` (COFEPRIS Licencia Sanitaria / Aviso de Funcionamiento) | footer, /about/ |
| `AW-16881895258/REPLACE_WITH_*_LABEL` (commented out) | tracking script `#cp-track`, only if you want Ads conversion labels |
| Social links (FB/IG/TT) are still `href="#"` | footer |

## Removed from the site (prescription / injectable)

Products removed from the mirror (pages, shop and category cards, home carousel, feeds, sitemap, images):
`losec-a-omeprazole-20-mg-14-capsules`, `durater-famotidine-20-mg-20-tablets`, `vitamin-b12-energy-shot-tribedoce-injectable-complex-with-b1-b6-b12-3-ampoules`.
In WordPress: move these three products to Trash (Products → All Products) and re-save permalinks.

Still to verify with your Responsable Sanitario (kept on the site):
`aspirina-protect-bayer-100-mg-28-tablets`, `analgen-naproxen-sodium-220-mg-20-tablets`, `diclofenac-2-32-topical-gel-100-g-tube-generic-for-voltaren`, `afrin-original-nasal-decongestant-spray-20-ml`,
`natural-sleeping-patch-non-addictive-12-hour-rest-support-everyday-lab` (health claims) and the kits `cold-flu-recovery-pack`, `hangover-helper-kit`, `first-aid-travel-kit` (check contents).

## Blog posts removed (they advertised prescriptions)

Removed from the mirror, with links, feeds and sitemap entries cleaned up:
`pharmacy-hours-medicine-access-cabo-san-lucas`, `pharmacy-delivery-cabo-san-lucas-8`, `urgent-care-pharmacy-san-jose-del-cabo`,
`pharmacy-delivery-cabo-san-lucas-7`, `pharmacy-delivery-cabo-san-lucas-4`, `essential-health-products-los-cabos`,
`finding-pharmacy-locations-la-paz`, `essential-medicines-travelers-cabo-san-lucas`, `pharmacy-hours-san-jose-del-cabo`,
`cabo-pharmacy-delivery-2`, `pharmacy-cabo-san-lucas-2`, `cmc-pharmacy-cabo-san-lucas-2`,
`best-medications-for-travelers-visiting-los-cabos`, `travel-health-kits-san-jose-del-cabo`
(plus the crawler's search-results and duplicate cart pages). In WordPress: trash these posts, and add 301 redirects to `/shop/` (Yoast Premium or the Redirection plugin).
Other posts may still mention pharmacies "open late" or other-pharmacy hours; review the remaining ~10 articles before submitting ads.

## redirect pharmacycabo.com → https://www.cabopharmacy.com/

`pharmacycabo` is a Next.js static export (`output: 'export'`) with `/en/` and `/es/`; `next.config` redirects do not work with `export`, use `vercel.json` in that project:

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "pharmacycabo.com" }],
      "destination": "https://www.cabopharmacy.com/",
      "statusCode": 301
    },
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.pharmacycabo.com" }],
      "destination": "https://www.cabopharmacy.com/",
      "statusCode": 301
    }
  ]
}
```

(Alternative with no code: Vercel → Project → Settings → Domains → `pharmacycabo.com` → Redirect to `www.cabopharmacy.com`, 301.)

## Apply the same changes in WordPress (live site)

1. **Brand** — Settings → General: Site Title `Cabo Pharmacy`. Yoast SEO → Settings → Site basics: Website name `Cabo Pharmacy`, Organization name `Cabo Pharmacy`, upload the new logo (`wp-content/uploads/cabo-pharmacy-logo.svg` is a stand-in; the old image said PHARMACYINCABO.COM — replace it with a PNG/SVG logo of your own). Use *Better Search Replace* (dry run first) for `Pharmacy in Cabo` → `Cabo Pharmacy` and `Pharmacy%20in%20Cabo` → `Cabo%20Pharmacy` in `wp_posts`, `wp_postmeta`, `wp_options`, Elementor data (`_elementor_data`). Rename the product tags `pharmacy in cabo` / `best pharmacy in cabo`.
2. **Footer / marquee / How it works** — edit the footer and header template parts (Appearance → Editor → Template Parts, or Elementor → Theme Builder) and the home page (Elementor). Copy the footer markup from `index.html` (`.pic-footer`, `.pic-licensed`).
3. **Pages** — create `privacy-policy`, `terms-of-service`, `returns-refunds` (content lives in the `entry-content` div of each `*/index.html` here), publish, and link them from the footer.
4. **Shop notice** — add to the Product Catalog / Product Taxonomy templates, or with a snippet:
   ```php
   add_action('woocommerce_before_shop_loop', function () {
     echo '<p class="cp-otc-notice" role="note">Over-the-counter products only. Prescription medication is not available through this store.</p>';
   }, 5);
   ```
5. **Schema** — remove the two custom `application/ld+json` blocks (search snippets / theme / Elementor HTML widgets for `Prescription Fulfillment`) and add the `Pharmacy` block from the home `<head>` (`#cp-pharmacy-schema`) via WPCode (home only).
6. **Tracking** — the Google tag (`AW-16881895258`) is already installed. Add the `#cp-track` script from any page here via WPCode (site-wide footer). In Google Ads create conversions from the events `whatsapp_click`, `phone_click`, `sms_click` (or import them from GA4).
7. **Sitemap/robots** — Yoast already serves `sitemap_index.xml`; set WordPress Address and Site Address (Settings → General) to `https://www.cabopharmacy.com` so sitemap and robots use https + www (today they emit `http://cabopharmacy.com/...`).

## Delivery campaign (Google Ads) — /pharmacy-delivery/

- New page `pharmacy-delivery/index.html` (title, meta description, H1, claims, steps, zones, categories, payment, 5 FAQs + FAQPage JSON-LD, WhatsApp/call CTA, legal notice). Added to the main menu ("Delivery"), the mobile drawer, the footer and `sitemap.xml`.
- Claims block (`.cp-claims`) added under the home hero and above the product grid on `/shop/` (and `/shop/page/2/`).
- Delivery times on product pages, `/delivery/` and `/faq/` were aligned to the new zone times; the minimum-order answers were changed to "no minimum order".
- In WordPress: create a page with slug `pharmacy-delivery` (paste the content of `.cp-page`), set the Yoast title/description from the `<head>`, add it to Appearance → Menus as "Delivery", and add the claims block to the home (Elementor HTML widget under the hero) and to the Product Catalog template. Existing `whatsapp_click` / `phone_click` tracking (`#cp-track`) covers the new page automatically.
- Assumptions to confirm: card payment on delivery, "real pharmacist" and "under 60 minutes" claims, no minimum order and the category link `/product-category/antacids-digestive/` (not included in this mirror).
