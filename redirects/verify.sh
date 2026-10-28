#!/usr/bin/env bash
# Verifica cada URL de redirects-map.csv contra el dominio ya desplegado.
# Uso: bash redirects/verify.sh [host]   (por defecto www.cabopharmacy.com)
# Para cada URL comprueba: 301, un solo salto y Location == destino; y que el destino responda 200.
HOST="${1:-www.cabopharmacy.com}"
CSV="$(dirname "$0")/redirects-map.csv"
OUT="$(dirname "$0")/verify-results.csv"
echo "url_vieja,destino,codigo,saltos,location,resultado,destino_http" > "$OUT"
python3 - "$CSV" <<'PY' | while IFS=$'\t' read -r old dest; do
import csv,sys
for r in csv.DictReader(open(sys.argv[1])): print(r['url_vieja']+'\t'+r['destino'])
PY
  path="${old#https://www.cabopharmacy.com}"
  url="https://${HOST}${path}"
  read -r code loc <<<"$(curl -s -o /dev/null -I -A 'Mozilla/5.0' -w '%{http_code} %{redirect_url}' "$url")"
  hops=$(curl -s -o /dev/null -L -I -A 'Mozilla/5.0' -w '%{num_redirects}' "$url")
  dcode=$(curl -s -o /dev/null -A 'Mozilla/5.0' -w '%{http_code}' "$dest")
  ok=FALLA; [[ "$code" == 301 && "$loc" == "$dest" && "$hops" == 1 && "$dcode" == 200 ]] && ok=OK
  echo "$url,$dest,$code,$hops,$loc,$ok,$dcode" >> "$OUT"
done
echo "Resultados en $OUT"; awk -F, 'NR>1{c[$6]++} END{for(k in c) print k, c[k]}' "$OUT"
