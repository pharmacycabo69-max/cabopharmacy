# Migración de cabopharmacy.com a https://www.rmcpharmacy.com

Estado: **preparado, no desplegado.** El sitio en vivo es este repositorio desplegado como sitio estático en Vercel
(no hay WordPress activo: `wp-login` da 403 y los sitemaps de Yoast ya no existen). Las redirecciones se hacen con `vercel.json`.

Archivos
- `vercel.json` — 138 reglas 301 (raíz, páginas, entradas, y patrones de tienda/productos/categorías/etiquetas/carrito/blog). Al final, un comodín que manda cualquier otra ruta a `/`. `robots.txt` y `sitemap.xml` quedan sin redirigir a propósito (Search Console los necesita).
- `redirects/inventory-urls.csv` — inventario (526 URLs): url_vieja, tipo, idioma, clics_90d, impresiones_90d.
- `redirects/redirects-map.csv` — mapa final con destino, regla y resultado de las pruebas.
- `redirects/woocommerce-products-backup.csv` — copia de los productos que existen en este repo (70).
- `redirects/verify.sh` — prueba con `curl` en vivo cada URL del CSV (ejecutar después del despliegue).

Pendientes que requieren cuentas que no tengo
1. **Search Console:** exporta Rendimiento (90 días, páginas) y pega clics e impresiones en las columnas `n/d`. Agrega la propiedad `rmcpharmacy.com` y usa "Cambio de dirección" si aplica.
2. **Un solo salto en el dominio sin www y en http:** hoy `cabopharmacy.com` redirige (308) a `www` a nivel de dominio en Vercel. En Vercel → Domains, quita esa redirección para que el dominio sin www sirva este proyecto; así `vercel.json` lo manda directo a rmcpharmacy. Vercel siempre fuerza https con un 308 antes, por lo que `http://` tendrá dos saltos aunque se ajuste todo.
3. **Productos de WooCommerce completos:** en este repo solo hay 70 de los 104 productos. Para el respaldo completo exporta desde WP Admin → Productos → Exportar (si aún tienes ese servidor).
4. Mantén el dominio y las redirecciones al menos 12 meses.

Despliegue: la rama `redirect-rmcpharmacy` no se ha publicado. Al fusionarla en `main` el sitio empieza a redirigir.
