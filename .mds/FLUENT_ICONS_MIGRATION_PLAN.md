# Plan: íconos de categorías a Fluent Emoji 3D (Microsoft)

> Rama de trabajo: `improvement-speed`. Fecha del plan: 2026-10-13. Estado: **propuesto, sin implementar**.
> Objetivo: que los íconos se vean igual en todos los dispositivos, con aspecto tipo iPhone (3D), y quitar el peso de `react-icons` del JavaScript de cada pantalla.

## 1. Punto de partida (medido)

| Dato | Valor |
|---|---|
| JavaScript del dashboard | ~13 MB sin comprimir / ~4.5 MB comprimido, en cada pantalla |
| Causa principal | `UniversalCategoIcon.tsx` y `CategoIcon.tsx` hacen `import * as` de `react-icons` (md, fa, ai, gi): paquetes enteros (`gi` solo trae 4,036 íconos, ~8 MB sin comprimir) para poder buscar un ícono por su nombre de texto |
| Íconos guardados en la base (categorías y subcategorías, tu cuenta) | **94 distintos** (gi 61, fa 16, md 17) |
| Íconos que ofrece el selector (`defaultIconsDB.ts`) | 145 (todos existen en react-icons) |
| Íconos de interfaz escritos a mano en el código (`"md/MdCategory"`, etc.) | 44 distintos en 52 archivos, **ninguno** coincide con los del selector |
| Imports directos y con nombre de `react-icons` | 14 archivos (esos sí se recortan bien al compilar) |
| Rutas de API que tocan el campo `icon` | categorías (nueva/actualizar), subcategorías (nueva/actualizar), presupuestos (nuevo/actualizar), sugerencias de reglas |
| Ícono por defecto de un usuario nuevo | `fa/FaTags` y `fa/FaTag` (`provisionNewUserData.ts`) |

**Hallazgo clave:** el peso no viene de "tener muchas librerías", viene de cómo se buscan los íconos por nombre. Eso se puede arreglar **sin cambiar cómo se ve nada** y por separado del cambio a Fluent.

## 2. Opciones de formato evaluadas (pesos medidos)

| Opción | Peso por ícono | Se ve igual en todos los dispositivos | Licencia | Comentario |
|---|---|---|---|---|
| **Fluent Emoji 3D como WebP 96 px (propio, en `public/`)** | **~2.5 KB** (PNG original 30 KB) | Sí | MIT, sin atribución obligatoria | Recomendada. Solo se descarga lo que se muestra; no suma nada al JavaScript |
| Fluent Emoji "color" vía Iconify (SVG) | 4–21 KB | Sí | MIT | No existe en 3D en Iconify; más pesado que el WebP |
| Emoji nativo (texto) | 0 KB | **No** (cada sistema dibuja el suyo) | n/a | Lo más ligero, pero sin 3D uniforme |
| Emojis de Apple | — | — | **No se pueden usar comercialmente** | Descartada |

Recomendación: **WebP propios de Fluent 3D**. Los 94 íconos que usas hoy pesarían ~240 KB en total si se mostraran todos; en una pantalla típica (≈20 distintos) son ~50 KB, comparado con ~8 MB de JavaScript de íconos hoy. Los emojis no se pueden teñir de color: donde hoy se usa `colore`, el ícono conservará sus colores 3D (el círculo de fondo de color sigue igual).

## 3. Fases

### Fase 0 — Registro estático (rápida, sin cambio visual, **la mayor ganancia de peso**)
- Reemplazar los `import * as` por un registro **explícito** con solo los íconos que de verdad se usan: los 44 de interfaz + los 145 del selector + cualquiera de los 94 guardados que no esté en esa lista.
- Prueba automática: "todo nombre de ícono que aparece en el código, en el selector o en la base resuelve a un ícono" y "no hay `import * as` de `react-icons`".
- Medir antes/después con `next build`. Meta: sacar ~8 MB (sin comprimir) del JavaScript compartido.
- Riesgo bajo; no toca datos.

### Fase 1 — Canal de producción de los íconos
- Script `scripts/build-fluent-icons.mjs` (solo se corre a mano): descarga del repo `microsoft/fluentui-emoji` (commit fijo), convierte a WebP 96 px con `sharp` (ya instalado), escribe en `public/icons/fluent/<slug>.webp`.
- Lista curada de ~300-400 emojis útiles para finanzas (comida, transporte, hogar, salud, entretenimiento, viajes, trabajo, dinero, compras, mascotas, educación…), con un manifiesto `manifest.json` (slug, nombre, palabras clave, grupo) para el buscador.
- Incluir `LICENSE` de Microsoft (MIT) junto a los archivos. Peso total estimado: ~1 MB en git; el navegador solo baja los que se ven.
- Cabeceras de caché largas (`immutable`) para `/icons/fluent/*` en `next.config.js`.

### Fase 2 — Renderizado
- Nuevo formato de nombre: `fluent/<slug>` (por ejemplo `fluent/pizza`). **Mismo campo `icon` de la base**, sin cambiar el esquema.
- `UniversalCategoIcon`: si el nombre empieza con `fluent/` dibuja `<img src="/icons/fluent/<slug>.webp" width height alt loading="lazy">`; si no, usa el registro heredado de la Fase 0. Si la imagen falla, muestra el ícono de categoría por defecto.
- Convivencia: los nombres viejos siguen funcionando, así que **no hay que migrar todo de golpe**.

### Fase 3 — Selector de íconos
- `IconDisplayerMenu` (usado por `EditCategoryModal` y `BudgetEditModal`) lee el manifiesto: rejilla por grupos y **buscador** (hoy son 145 íconos fijos).

### Fase 4 — Equivalencias viejo → nuevo
- Tabla revisada a mano `iconLegacyMap.ts`: `gi/GiHamburger → fluent/hamburger`, `md/MdSoupKitchen → fluent/pot-of-food`, etc., para los 145 del selector y los 94 de la base.
- **Página de vista previa** (solo desarrollo) con "ícono viejo | ícono nuevo" lado a lado para que la apruebes antes de usarla.
- Los que no tengan equivalente claro se marcan y los eliges tú.

### Fase 5 — Datos (decisión tuya, **opcional**)
- **Opción A (recomendada, sin tocar la base):** al dibujar, si el nombre es viejo y existe equivalencia, se muestra el nuevo. Nada se escribe en la base; los íconos nuevos que elijas se guardan ya como `fluent/…`.
- **Opción B:** script de migración que reescribe `icon` en categorías, subcategorías y presupuestos. Requiere tu aprobación explícita, respaldo completo previo (como el del 2026-10-07), modo de prueba que solo muestra los cambios, y es repetible.

### Fase 6 — Valores por defecto y rutas
- Ícono por defecto de usuarios nuevos (`provisionNewUserData.ts`) y categorías predeterminadas pasan a `fluent/…`.
- Revisar que las rutas listadas arriba aceptan y devuelven el nuevo formato (solo pasan el texto), y la subida desde Excel / sugerencias de reglas.

### Fase 7 — Limpieza
- Los 44 íconos de interfaz (flechas, calendario, ayuda…) **se quedan en `react-icons`** con imports con nombre: pesan unos pocos KB y no hace falta cambiarlos. Si después quieres quitar la dependencia por completo, es una fase aparte.
- Borrar el registro heredado de los íconos que ya no se usen.

## 4. Pruebas
- Unitarias: cada nombre del selector, de la base y de las equivalencias resuelve; el manifiesto y los archivos coinciden; no hay `import * as react-icons`.
- Presupuesto de peso en `next build` (falla si el JavaScript del dashboard crece por encima del límite acordado).
- En Chrome, con cuenta desechable: dashboard, Movimientos, Presupuestos, Categorías (elegir y cambiar ícono), Historial, modo oscuro y claro, móvil.

## 5. Riesgos y cómo se cubren
| Riesgo | Cobertura |
|---|---|
| Un ícono guardado sin equivalencia | Fallback al ícono por defecto + lista de pendientes en la página de vista previa |
| Muchos `<img>` en listas largas (3,000+ movimientos) | Misma URL → el navegador la cachea y decodifica una vez; `loading="lazy"` |
| Imagen no disponible | `onError` → ícono por defecto |
| Emojis no se pueden teñir | El círculo de color de fondo se mantiene; el ícono conserva sus colores |
| Datos reales | Opción A no escribe nada; la B solo con respaldo y aprobación |

## 6. Orden sugerido y decisiones que necesito
1. **Fase 0** primero (es independiente y es donde está casi todo el peso).
2. Fases 1-3 (assets, renderizado y selector) en la misma rama.
3. Fase 4 con tu aprobación visual de la tabla de equivalencias.
4. Fase 5: elegir A o B.

Decisiones: (a) ¿los 44 íconos de interfaz se quedan en react-icons? (recomendado sí); (b) ¿opción A o B para los datos?; (c) ¿alguna categoría de emojis que quieras sí o sí en el selector?
