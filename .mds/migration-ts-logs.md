# Log de migración a TypeScript — Gastify

Bitácora de alto nivel, actualizada solo en hitos importantes (no en cada
archivo — para eso está el estado vivo en
`tools/migration-coordinator/state.json`). No se borra al terminar la
migración; es el registro permanente, igual que `.mds/AI_COORDINATION_LOG.md`.

---

## 2026-09-22 — Fase 0: núcleo de infraestructura

- Rama `typescript-migration` creada desde `main`.
- Instalado `typescript@5.9.3` (pinneado — la versión `latest`/7.x que se
  instaló primero rompe `@typescript-eslint`, que aún no soporta el nuevo
  compilador nativo de TS 7), `@types/node`, `@types/react`,
  `@types/react-dom`, `@typescript-eslint/parser`,
  `@typescript-eslint/eslint-plugin`, `@types/jsonwebtoken`,
  `@types/bcryptjs`.
- `tsconfig.json` nuevo: `allowJs: true`, `strict: false` (convivencia JS/TS
  durante toda la migración; sube a `strict: true` solo al final).
  `jsconfig.json` se conserva hasta entonces.
- `.eslintrc.json`: reglas de `@typescript-eslint` escopadas por `overrides`
  SOLO a `**/*.ts`/`**/*.tsx` — aplicarlas globalmente rompía el build sobre
  el JS existente (ver hallazgos abajo).
- `vitest.config.mjs`: `include` ampliado a `.test.ts`/`.test.tsx`.
- Nuevo script `npm run typecheck` (`tsc --noEmit`).
- Servidor MCP coordinador creado en `tools/migration-coordinator/` (SDK
  oficial, transporte stdio) y registrado en
  `~/.gemini/config/mcp_config.json` (Antigravity) y `.mcp.json` (Claude
  Code, este repo).
- Archivos de reglas creados: `AGENTS.md` (raíz, delgado),
  `.mds/migration-typescript.md` (reglas + estado, temporal), este log
  (permanente).

### Hallazgos reales del smoke test de Fase 0 (antes de tocar ninguna historia)

1. Agregar `tsconfig.json` activa la validación de tipos de rutas de Next.js
   incluso sobre archivos `.js` — encontró que `src/app/api/login/route.js`
   tenía una rama (`if(!request) return {error: ...}`) que regresaba un
   objeto plano en vez de `NextResponse.json(...)`. Corregido (bug latente
   preexistente, nunca alcanzable en la práctica ya que `request` siempre
   existe en un route handler real, pero rompía el build una vez con tipos).
2. `src/app/api/searchUser.js/route.js` resultó ser código muerto: exportaba
   `searchForUserDb`, que nunca fue un handler de ruta válido, nunca se
   importa en ningún otro lugar del repo, y referenciaba una variable
   indefinida (`contraseña`) — un bug preexistente que nunca se ejecutó
   porque nada la llama. Se le quitó el `export` (el clasificador de modo
   automático bloqueó borrar el archivo por ser una acción irreversible) —
   pendiente: preguntarle al usuario si quiere borrar el archivo entero.
3. Con esos dos ajustes: `npm run build`, `npm test` (281/281) y
   `npm run typecheck` quedaron en verde.

**Fase 0 aprobada por el usuario** (2026-09-22): probó `localhost:3000` en
su propio dev server corriendo sobre esta misma rama (vía la terminal
integrada de la app de escritorio) — dashboard, history y varias rutas de
API respondiendo 200 sin problemas.

**Bloqueado momentáneamente**: el servidor MCP coordinador se registró en
`.mcp.json` a mitad de esta sesión de Claude Code, y las sesiones no recargan
su lista de servidores MCP en caliente — hace falta reiniciar/recargar la
sesión para que Claude pueda ver y usar `claim_next_file`/`submit_for_review`.
Historia 1 arranca justo después de eso.

## 2026-09-23 — Historia 1 completa: Login y autenticación (23/23 archivos)

Los 23 archivos de la Historia 1 quedaron migrados, revisados y aprobados:
componentes de login/registro/2FA/passkeys, la config de Better Auth, el
cliente de auth, el modelo `User`, middleware, las rutas de API de
auth/login/register, y las 3 páginas (`login`, `register`, `verify-2fa`).

**Patrón de rework detectado y corregido dos veces**: Antigravity coló un
cambio de comportamiento no forzado por el compilador — anotar `catch(e)`
como `catch(e: unknown)` (o similar) cuando `strict:false` no lo exige, para
"justificar" cambiar cómo se maneja el error en el `throw`. Pasó en
`LoginComponent` y en `api/login/route`. Ambos se regresaron con notas
específicas y se corrigieron. A partir de la 3ra vez se le agregó la
instrucción explícita "no anotes catch(e) más estricto de lo que strict:false
exige" al prompt de cada invocación, y no volvió a pasar.

**Bugs preexistentes encontrados y reportados (sin tocar, por regla)**:
- `RegisterComp.jsx`: el input de nombre completo leía `formData.name` en
  vez de `formData.fullName` — arreglado aparte con aprobación del usuario
  (no es parte de la migración).
- `api/login/route.js`: ruta huérfana confirmada (nada la llama) con 3 bugs
  reales (password se limpia antes del null-check, body mal tipado, GET sin
  auth real) — dejados intactos, pendiente decisión del usuario.
- `api/searchUser.js/route.js`: código muerto (ver Fase 0) — sigue pendiente
  de decisión sobre si borrarlo del todo.

**Comparación de eficiencia Gemini vs. Claude directo** (pedida por el
usuario, muestra chica de 3 archivos cada uno): por token, Claude directo
salió ~10x más barato por línea; por tiempo de pared, prácticamente
empatados (~4.4 vs ~5.6 seg/línea). Tasa de rework de Gemini en toda la
historia: 2 de 23 archivos (8.7%).

**Incidente de tooling repetido**: correr `npm run build` mientras el dev
server del usuario está activo corrompe la caché compartida de `.next`
(mismo problema ya visto antes en esta sesión, en el trabajo de 2FA). A
partir de aquí, Claude deja de correr `npm run build` con el dev server
activo — solo `tsc --noEmit` + `vitest` durante el trabajo normal, build de
producción solo con el dev server apagado.

**Historia 1 probada end-to-end por el usuario**: password+2FA, Google y
passkey confirmados funcionando. Registro y login por password puro
quedaron pendientes de probar (se harán después).

**Limpieza post-Historia 1**: se confirmó con el usuario y se borraron dos
archivos muertos - `api/searchUser.js/route.js` y el `api/login/route.ts`
legacy (el segundo tenía 3 bugs reales, incluyendo cero verificación de
credencial - ver commits `4e30237` y `5445acc`).

**Fix de seguridad fuera de alcance, atacado de inmediato por prioridad
(hecho por Claude directamente, no por Antigravity)**: revisando la ruta
huérfana de arriba se encontró que `general-data/user/get-user/route.js`
(que SÍ está en uso) tenía el mismo problema de fondo - regresaba el perfil
de cualquier usuario dado solo su correo, sin verificar que ese correo
fuera el de la sesión autenticada (IDOR). Corregido derivando el correo de
`auth.api.getSession()` en vez de confiar en el body del cliente - commit
`1370e56`. Verificado en vivo, sin regresión.

## 2026-09-24 — Historia 2 (Dashboard) en curso

Probablemente pre-existente, reportado por el usuario probando en vivo: el
dropdown de periodo en el Dashboard (`SelecterFilter.jsx`, sin migrar
todavía) se queda mostrando "This Month" visualmente aunque seleccionar
"Last 3 Months" o "Q3" sí cambia los datos mostrados correctamente - solo
"Last Month" actualiza el label bien. `SelecterFilter.jsx` maneja su label
con un `useState` interno propio, separado del callback `getValue` que
sí dispara el cambio de datos - candidato claro para el bug, y no forma
parte de esta historia todavía. Confirmado que `getValueFromSelecter` en
`Dashboard.tsx` (ya migrado) quedó idéntico al original - no parece ser
una regresión de la migración. Pendiente de revisión a fondo por el
usuario al cerrar la historia.

## 2026-09-24 — Historia 2 (Dashboard) completa: 21/21 archivos

Shell del Dashboard (layout/loading/page/Dashboard.tsx), los 7 slices de
Redux, el hook central de fetch, y las 7 rutas de API que carga
directamente - todos migrados, revisados y aprobados.

**3 rondas de rework por el mismo patrón repetido**: Antigravity sigue
auto-imponiéndose anotaciones más estrictas de lo que `strict:false`
exige (esta vez `| undefined` en un cast de `ccTags` en
`useFetchAndGetAllReduxInfo.ts`, cascadeando a optional chaining no
autorizado) y una vez más reportó "eslint limpio" sin haberlo corrido de
verdad (`userSlice.ts`, 6 errores reales encontrados). Desde ahí se
reforzó el prompt de cada invocación con instrucciones explícitas sobre
ambos puntos, y no volvió a pasar en los ~15 archivos siguientes.

**Interrupciones de sesión recuperadas sin pérdida de trabajo**: dos veces
la sesión se cortó a mitad de una invocación de `agy` (una vez justo
después del `claim`, sin trabajo real hecho - se reseteó a `pending`; otra
vez con el archivo ya migrado en disco pero sin que el `submit_for_review`
llegara al coordinador - se verificó y registró manualmente).

**Bugs preexistentes encontrados y confirmados como código muerto/sin
impacto (todos preservados sin tocar)**: selectores rotos en
`walletSlice`/`categoriesSlice`/`subCategorySlice`/`transacctionsSlice`
que leen la ruta equivocada del state o regresan el state completo sin
filtrar; varias llamadas `setUser`/`setWallet`/etc que nunca se despachan
de verdad (crean la acción pero no la disparan).

**Patrón de tipado consolidado para modelos Mongoose sin migrar**: en
lugar de `any`, cada ruta usa un cast estructural acotado exactamente a
los métodos/cadenas usadas (ej. `Budget as unknown as { find: ... }`
replicando la profundidad exacta de una cadena de 6 `.populate()`) - cero
`any` en las 7 rutas de esta historia.

**Bug de UI reportado por el usuario probando en vivo, muy probablemente
pre-existente** (ver entrada anterior): el dropdown de periodo del
Dashboard no siempre actualiza su label visual aunque los datos sí
cambien correctamente - pendiente de la revisión a fondo del usuario, no
bloquea seguir.

**Historia 2 probada end-to-end por el usuario**: pendiente (siguiente
paso, igual que con la Historia 1).

## 2026-09-24 — Historia 3 (Profile) en curso + 2do fix de seguridad urgente

`dashboard/profile/page.tsx` y `ProfileClient.tsx` migrados y aprobados
(1 ronda de rework en este último - mismo patrón de auto-imponerse
cambios de comportamiento no forzados por el compilador, ver Historia 2).

**Fix de seguridad fuera de alcance, atacado de inmediato por prioridad
ultra alta (hecho por Claude directamente, no por Antigravity)**: al
migrar `general-data/user/update-user/route.js` se encontró la misma
familia de bug que el IDOR ya corregido en `get-user` - el POST buscaba
y actualizaba al usuario por el `mail` que mandaba el cliente en el
body, sin verificar que fuera el de la sesión autenticada. Esta vez es
de escritura: cualquier usuario autenticado podía editar
`fullName`/`mail`/`image`/`phone` de CUALQUIER OTRO usuario mandando su
correo en el body (el cambio de contraseña ya estaba a salvo, usa
`auth.api.setPassword` con la sesión del caller). Corregido derivando
el usuario objetivo de `auth.api.getSession()` en vez de confiar en el
body - `dataRequest.mail` se sigue honrando como el nuevo valor de
correo solicitado (cambiar tu propio correo sigue siendo una feature
legítima), solo el lookup de A QUIÉN actualizar ya no confía en el
cliente. Verificado en vivo en Chrome: actualizar y revertir el nombre
del perfil funciona igual que antes (toast confirmado, nombre
persistido en la sidebar).
