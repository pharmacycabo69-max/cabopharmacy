# Auditoría de redirecciones: cabopharmacy.com y pharmacycabo.com

Fecha: 25 noviembre 2026 · Documento rector: CaboPharmacy V4.0 · Decisión del propietario: **mantener la redirección a RMC**.
No se creó sitio, catálogo, checkout ni landings. Nada de esta rama está en producción.

## 1. Estado por tarea

| Tarea | Estado | Evidencia |
|---|---|---|
| Cadenas HTTP/HTTPS, www y sin www | Probada | `REDIRECT_MAP.csv` (635 casos, 1,324 saltos) |
| Rutas históricas EN/ES | Probada | 526 rutas de cabopharmacy y 15 de pharmacycabo: todas terminan en 200 |
| Parámetros de atribución | Probada | utm_*, gclid, gbraid, wbraid, fbclid, msclkid se conservan |
| DNS | Probada (lectura) | NS de Vercel en ambos; TXT `google-site-verification` presente en ambos |
| Destinos en RMC (status, canonical, idioma, noindex) | Probada | `DESTINATION_HEALTH.csv`: 200, canonical propio, sin noindex |
| Móvil, escritorio, AdsBot, Googlebot | Probada | mismo 301 y destino; capturas en `capturas/` |
| Mejoras reversibles (reglas y robots) | Implementada en rama, pendiente de aprobación | `changed.csv`: 15 destinos |
| Search Console (90 días y 12 meses) | **Bloqueada** | sin sesión de Google en el navegador |
| Google Ads (campañas, URLs finales, conversiones) | **Bloqueada** | sin sesión de Google |
| Enlaces externos y URLs indexadas | **Bloqueada** | requiere Search Console |
| Reglas del registrador / forwarding | Pendiente | DNS apunta a Vercel; no hay acceso al panel del registrador |
| Reglas CDN / dominios en Vercel | Pendiente | no hay acceso al panel; se infiere de las cabeceras |

## 2. Cadenas observadas (producción)

| Entrada | Saltos | Cadena |
|---|---|---|
| `https://www.<dominio>/ruta` | 1 | 301 → RMC (200) |
| `https://<dominio>/ruta` | 2 | 308 → www · 301 → RMC |
| `http://www.<dominio>/ruta` | 2 | 308 → https · 301 → RMC |
| `http://<dominio>/ruta` | 3 | 308 → https · 308 → www · 301 → RMC |
| `/ruta//` (doble diagonal) | 2 | 308 · 301 |

Sin bucles, sin errores y sin redirecciones temporales (302/307) en ningún caso.
El error reportado en `pharmacycabo.com/es/` **no se reproduce**: 308 → 301 → `rmcpharmacy.com/es` (200).

## 3. Matriz de hallazgos

| # | Gravedad | Hallazgo | Acción | Estado |
|---|---|---|---|---|
| H1 | Alta | La etiqueta de Ads `AW-16881895258` del sitio anterior no aparece en el HTML de RMC ni en su contenedor GTM-P4G2TNKX (solo GA4). Si hay campañas que cuentan conversiones con ella, hoy no se registran | Verificar en Google Ads y GTM | Bloqueado (acceso) |
| H2 | Alta (si hay campañas) | Anuncios con URL final en cabopharmacy o pharmacycabo redirigen a otro dominio: Google Ads puede rechazarlos por destino distinto | Cambiar URLs finales a rmcpharmacy.com en Ads | Propuesto |
| H3 | Media | `robots.txt` de cabopharmacy bloquea `/cart/`, `/my-account/`, `/wp-admin/` y `?add-to-cart=`: los buscadores no pueden ver el 301 de esas rutas | `Allow: /` | En rama |
| H4 | Media | `redirects-map.csv` del repo no coincidía con producción en 80 URLs (decía `/delivery`; producción envía a tienda y categorías desde el PR #2) | Mapa regenerado; el simulador coincide con producción en las 526 | En rama |
| H5 | Baja | 13 feeds de artículos iban a la portada aunque el artículo tiene destino propio | Mismo destino que el artículo | En rama |
| H6 | Baja | 2 productos con equivalente exacto en la tienda RMC iban a `/shop` genérico | Regla 1:1 | En rama |
| H7 | Baja | `/es/...` en cabopharmacy caía en la portada en inglés | `/es` → `rmcpharmacy.com/es` | En rama (se verifica en la vista previa) |
| H8 | Media | Dos o tres saltos al entrar sin www o por http | Ver §4, cambio en Vercel → Domains | Propuesto (producción) |
| H9 | Baja | Rutas basura (`/wp-login.php`, `/ads.txt`, rutas inexistentes) van a la portada de RMC; Google suele tratarlo como soft 404 | Opcional: responder 410 a `wp-*` y `xmlrpc.php`. No aplicado: la decisión vigente es redirigir | Propuesto |
| H10 | Media | RMC no tiene páginas de privacidad ni términos (404 en las rutas habituales y sin enlace en el pie); las viejas `/privacy-policy/`, `/terms-of-service/` y `/returns-refunds/` caen en la portada | Compartido con RMC (`FOR_RMC.md`) | Para RMC |
| H11 | Baja | `pharmacycabo.com`: sitemap y robots anuncian URLs sin www (un salto extra) | Cambiar en su repositorio | Propuesto (otro repositorio, no se tocó) |
| H12 | Info | El meta de verificación de la portada vieja ya no se sirve; la verificación por DNS sigue presente | Confirmar en Search Console que ambas propiedades de dominio siguen verificadas | Pendiente |
| H13 | Info | El repositorio `cabopharmacy` es público e incluye el respaldo de productos y la nota de cumplimiento | Considerar hacerlo privado | Propuesto |

`sitemap.xml` (94 URLs viejas, todas con regla) se conserva a propósito: ayuda a que los buscadores recorran los 301.
Revisar en Search Console y retirarlo cuando las URLs viejas dejen de aparecer (no antes de 3 a 6 meses).

## 4. Cambios de producción propuestos (requieren aprobación)

1. **Fusionar esta rama** (reglas y `robots.txt`). Prueba posterior: `node redirects/audit.mjs`; esperado: 0 "destino distinto".
2. **Un salto sin www** (Vercel → proyecto → Domains): en `cabopharmacy.com` y `pharmacycabo.com`, quitar la redirección de dominio hacia `www` para que el dominio raíz sirva el proyecto y `vercel.json` lo envíe directo a RMC. Resultado esperado: https sin www 1 salto; http 2 (Vercel fuerza https antes).
3. **Ads:** actualizar URLs finales y extensiones a rmcpharmacy.com; revisar acciones de conversión de `AW-16881895258`.
4. **Search Console:** exportar Rendimiento (90 días y 12 meses) por página; usar "Cambio de dirección" hacia la propiedad de RMC.
5. Mantener dominios y redirecciones al menos 12 meses.

## 5. Rollback

- Reglas y robots: `git revert <commit de fusión>` y publicar; o en Vercel → Deployments → "Promote" al despliegue anterior.
- Dominios: volver a activar en Vercel la redirección raíz → www.
- DNS: no se propone ningún cambio.

## 6. Riesgos

- Un 301 lo guardan en caché navegadores y buscadores: revertir un destino no es inmediato para quien ya lo visitó.
- Al quitar la redirección raíz → www, verificar que el certificado del dominio raíz siga activo.
- Las dos reglas 1:1 de producto dependen de que esas fichas sigan en la tienda RMC.

## 7. Límites de esta auditoría

- Las 526 rutas vienen del inventario del repositorio; sin Search Console puede haber URLs externas no inventariadas (caen en el comodín).
- Las columnas de clics e impresiones siguen en `n/d`; no se estimó ninguna métrica.
- Los parámetros se probaron con valores ficticios.
