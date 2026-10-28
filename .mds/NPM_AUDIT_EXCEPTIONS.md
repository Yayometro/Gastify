# Excepciones de `npm audit`

Documento vivo. Registra qué avisos de `npm audit` se aceptan, por qué, y qué no se debe hacer para "limpiarlos".

- Última revisión: 2026-10-27, tras la migración a Next 16.4.3 y next-cloudinary 7.
- Comandos para reproducir:
  - Producción: `npm audit --omit=dev`
  - Todo, incluido desarrollo: `npm audit`

## Estado actual

- **Producción:** 0 críticos, 3 altos. Los tres son excepciones documentadas abajo.
- **Desarrollo:** 0 avisos.

## Excepciones aceptadas

### 1. `expo` 58.0.19 (dependencia directa de la app móvil)

- **Qué marca npm:** rangos de canary (`52.0.0-canary-… || >=55.0.0-canary-20250912-b5ce2a8`).
- **Qué tenemos:** la versión estable más reciente de Expo.
- **Por qué es falso positivo:** el rango `>=55.0.0-canary-…` incluye por orden de semver todas las versiones estables posteriores, así que marca la 58 aunque sea una estable. Los avisos de Expo que encontré en GitHub son `GHSA-wr5g-q49g-548w` (crítico, `expo < 48.0.0`) y `GHSA-rwx9-wqj8-vr77` (`expo < 9.1.0`). Ninguno afecta la versión 58.
- **Qué sugiere npm:** `npm audit fix --force`, que baja a `expo@54.0.38`. **No se hace**: sería una regresión mayor.
- **Cuándo revisar:** cuando Expo publique un aviso con rango de versiones estables.

### 2. `@expo/cli` 58.1.15 (dependencia transitiva de `expo`)

- **Qué marca npm:** `>=54.1.0-canary-20250930-9dc59d3`.
- **Por qué es falso positivo:** mismo motivo que `expo`. El rango canary incluye la versión estable instalada.
- **Qué sugiere npm:** lo mismo que en el punto 1, bajar a Expo 54. **No se hace.**

### 3. `zod` 3.25.76 (dependencia directa de la raíz, web)

- **Qué marca npm:** `<4.6.6`, que literalmente incluye las versiones 3.x.
- **Por qué es falso positivo:** el aviso `GHSA-mrhx-c7xc-m3w5` describe zod hasta la 4.6.5, con el fallo en `$ZodArray`, una clase de la rama 4. La rama 3 no tiene esa clase.
- **Dónde sí hay zod 4:** `better-auth` y `@better-auth/*` usan zod 4.6.7, que ya está parcheado.
- **Qué sugiere npm:** migrar la raíz a zod 4 (cambio mayor, cambia la API de validación en las rutas). **No se hace ahora.** Si decidimos migrar, es un proyecto aparte.

## Ya resuelto en esta revisión

| Paquete | Antes | Ahora | Nota |
|---|---|---|---|
| `next` | 15.5.27 (crítico y altos) | 16.4.3 | Migración a Next 16 en la rama `upgrade/next-16`. |
| `next-cloudinary` | 6.19 (alto, con `@cloudinary-util/url-loader`) | 7.0.0 | Exige Next 16 como peer. |
| `node-forge` | 1.4.0 (alto, firmas RSA) | 1.4.1 | Lo aplicó `npm audit fix`. El aviso de GitHub `GHSA-86w9-cpqp-85rv` todavía dice "sin parche" en su base; se verifica cuando la actualicen. |
| `postcss` | copia vieja dentro de Next | 8.5.32 | Forzado con `overrides`. |
| `vite`, `vitest` (desarrollo) | avisos altos y moderados | `vite` 8.3.5, `vitest` 4.1.12 | `npm audit fix` sin salto mayor. |
| `follow-redirects`, `body-parser` | altos | versiones corregidas | `npm audit fix` sin salto mayor. |

## Reglas

1. **No ejecutar `npm audit fix --force`.** Sugiere bajar Expo a la 54 y migrar zod a la 4.
2. Antes de aceptar un aviso nuevo, leer en GitHub el id, el rango afectado y la versión parcheada. Si el rango marca una versión que no tiene el problema, documentar aquí el motivo.
3. Revisar este documento cada mes y cada vez que se actualice Expo o zod.
