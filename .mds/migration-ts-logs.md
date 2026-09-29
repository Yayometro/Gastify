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

**3er, 4to y 5to fix de seguridad urgente, mismo día, misma prioridad
(hechos por Claude directamente, no por Antigravity)**: antes de migrar
las 3 rutas de API tokens de esta historia, se revisaron a mano y
resultó que las 3 tenían exactamente el mismo bug de fondo:

- `api-tokens/list/route.js`: devolvía los tokens de CUALQUIER usuario
  cuyo `mail` se mandara en el body.
- `api-tokens/remove/route.js`: revocaba un token de CUALQUIER usuario
  cuyo `mail` se mandara en el body (denegación de servicio del
  conector de otra persona).
- `api-tokens/new/route.js`: el más grave de los cinco - generaba un
  token de API nuevo, de acceso completo, para el `mail` que mandara el
  cliente en el body. Cualquier usuario autenticado podía crearse un
  token permanente para operar la cuenta de otra persona vía el
  conector MCP (crear transacciones, leer resúmenes, etc.) sin que la
  víctima se enterara.

Las 3 rutas quedaron corregidas igual que `get-user`/`update-user`:
derivan el usuario objetivo de `auth.api.getSession(request.headers)`
en vez de confiar en el `mail` del body. El único call site real
(`ApiTokensPanel.tsx`) siempre manda el correo de su propia sesión, así
que no cambia ningún comportamiento legítimo. Verificado en vivo en
Chrome de punta a punta: se listaron los 3 conectores reales del
usuario (Claude, ChatGPT, Gemini, intactos), se creó un token de prueba
("TS Migration Test") vía `new/` y se revocó vía `remove/`
correctamente, quedando los 3 conectores reales sin tocar.

### Resumen consolidado — todos los bugs de seguridad encontrados y corregidos en esta migración (hasta ahora)

| # | Ruta | Tipo | Commit | Severidad |
|---|------|------|--------|-----------|
| 1 | `general-data/user/get-user` (GET) | IDOR de lectura - cualquiera podía leer el perfil de otro usuario dando su correo | `1370e56` | Alta |
| 2 | `general-data/user/update-user` (POST) | IDOR de escritura - cualquiera podía editar fullName/mail/image/phone de otro usuario | `bb8f987` | Alta |
| 3 | `general-data/api-tokens/list` (POST) | IDOR de lectura - cualquiera podía listar los tokens de conector de otro usuario | `a9e8f17` | Media |
| 4 | `general-data/api-tokens/remove` (POST) | IDOR de escritura - cualquiera podía revocar tokens de conector de otro usuario | `a9e8f17` | Media |
| 5 | `general-data/api-tokens/new` (POST) | IDOR de escritura, la más grave de la familia "mail equivocado" - cualquiera podía crear un token de acceso completo a la cuenta de otro usuario | `a9e8f17` | Crítica |
| 6 | `general-data/accounts/*` (reorder, update-account, new-account, remove-account) | Cero verificación de sesión (no solo "mail equivocado" - directamente sin auth), y sin cobertura del middleware por ser rutas de API. `remove-account` permitía borrar cualquier cuenta de la base de datos sin ninguna autenticación. | `94723a3` | Crítica |
| 7 | `general-data/wallet/get-wallet` (POST) | IDOR de lectura - ya migrada en Historia 2, se me pasó en esa revisión. Cualquiera podía leer el wallet completo (presupuesto, cash, moneda) de otro usuario. | `b8897fc` | Alta |
| 8 | `general-data/wallet` (POST) | Cero verificación de sesión - cualquiera podía editar nombre/cash/presupuesto/moneda de CUALQUIER wallet dado su id. | `b8897fc` | Crítica |
| 9 | `general-data/categories/get-all` (POST) | IDOR de lectura - sin call site real, pero alcanzable por HTTP directo. | `83956d1` | Media |
| 10 | `general-data/categories/new-category` (POST) | Cero verificación de sesión - se podía plantar una categoría en el wallet de cualquier usuario. | `83956d1` | Alta |
| 11 | `general-data/categories/update-category` (POST) | Cero verificación de sesión - se podía editar la categoría de cualquier usuario dando su id. | `83956d1` | Alta |
| 12 | `general-data/categories/remove-category` (POST) | Cero verificación de sesión - se podía borrar la categoría de cualquier usuario dando su id. | `83956d1` | Crítica |
| 13 | `general-data/subcategory/new` (POST) | Cero verificación de sesión - mismo problema que `new-category`. | `83956d1` | Alta |
| 14 | `general-data/subcategory/update` (POST) | Cero verificación de sesión, la más delicada del lote - re-parentear una subcategoría ajena dispara `Transaction.updateMany`, pudiendo re-etiquetar transacciones de otro usuario. | `83956d1` | Crítica |
| 15 | `general-data/subcategory/remove` (POST) | Cero verificación de sesión - mismo problema que `remove-category`. | `83956d1` | Crítica |
| 16 | `general-data/categories/get-categories` (POST) | IDOR de lectura - ya migrada en Historia 2, mismo review miss que `get-wallet`. | `e49f66e` | Alta |
| 17 | `general-data/subcategory/get-sub-categories` (POST) | IDOR de lectura - ya migrada en Historia 2, mismo review miss que `get-wallet`. | `e49f66e` | Alta |
| 18 | `general-data/budget/get` (POST) | IDOR de lectura - ya migrada en Historia 2, mismo review miss que `get-wallet` (variable confusamente nombrada `id`, en realidad es el mail). | `414893b` | Alta |
| 19 | `general-data/budget/get-historical` (POST) | IDOR de lectura, usada por `HistoricalBudgetsComparative.jsx`/`HistoricalWalletAnalyzer.jsx`. | `414893b` | Alta |
| 20 | `general-data/budget/new` (POST) | Cero verificación de sesión - se podía plantar un presupuesto en el wallet de cualquier usuario. | `414893b` | Alta |
| 21 | `general-data/budget/update` (POST) | Cero verificación de sesión - se podía editar el presupuesto de cualquier usuario dando su id. | `414893b` | Alta |
| 22 | `general-data/budget/remove` (POST) | Cero verificación de sesión - se podía archivar el presupuesto de cualquier usuario y desvincular las transacciones de sus proyectos. | `414893b` | Crítica |
| 23 | `general-data/transactions/[id]` (POST update) | Cero verificación de sesión - `Transaction.findById(params.id)` a secas permitía editar cualquier transacción (dinero real) de cualquier usuario si se conocía/adivinaba el id. | `2a3e538` | Crítica |
| 24 | `general-data/transactions/edit-many` (POST) | Cero verificación de sesión - permitía editar en bloque cualquier transacción por id, e incluso reasignarlas a la cuenta de OTRO usuario (`Account.findById` sin acotar). | `38a7f9e` | Crítica |
| 25 | `general-data/transactions/get-all` (POST) | Cero verificación de sesión - `const userMail = await request.json()` a secas exponía el perfil completo + todas las transacciones/categorías/subcategorías/cuentas de cualquier email, autenticado o no. | `0b29d8d` | Crítica |
| 26 | `general-data/transactions/link-budget` (POST) | Cero verificación de sesión - `Transaction.findById(transactionId)` a secas permitía vincular/desvincular movimientos de cualquier usuario a/de proyectos por id. | `7f2972b` | Alta |
| 27 | `general-data/transactions/new-transaction` (POST) | Cero verificación de sesión - el `user`/`wallet` del body se pasaban tal cual a `createTransaction`, permitiendo forjar transacciones atribuidas a cualquier usuario/wallet. | `cbc48d2` | Crítica |
| 28 | `general-data/transactions/remove-many` (POST) | Cero verificación de sesión - `Transaction.deleteMany({_id:{$in:manyTrans}})` a secas permitía a cualquiera (autenticado o no) borrar en bloque transacciones de cualquier usuario del sistema. Probablemente el bug más severo encontrado en toda la migración. | `1f408d2` | Crítica |
| 29 | `general-data/transactions/remove-transaction/[id]` (POST) | Cero verificación de sesión - `Transaction.findByIdAndDelete(params.id)` a secas permitía borrar cualquier transacción de cualquier usuario por id. | `2f96af3` | Crítica |
| 30 | `general-data/transactions/speech-add` (POST) | Cero verificación de sesión - `User.findById(transObj.user)` confiaba en el id de usuario mandado por el cliente, permitiendo crear transacciones de voz en la cuenta de cualquier usuario. | `8a3f0ea` | Alta |
| 31 | `general-data/transactions/transfer` (POST) | Ya tenía checks de ownership de cuenta, pero comparaba contra el `user`/`wallet` mandado por el cliente sin verificar sesión - un atacante que conociera esos ids de una víctima podía crear transferencias fantasma en su wallet. | `4021669` | Alta |
| 32 | `general-data/transactions/transfer/remove` (POST) | Cero verificación de sesión - `Transaction.find/deleteMany({transferGroupId})` a secas permitía borrar las piernas de cualquier transferencia de cualquier usuario conociendo/adivinando el transferGroupId. | `7a8ca3c` | Alta |
| 33 | `general-data/transactions/get-transactions` (POST) | Cero verificación de sesión - mismo patrón `const userMail = await request.json()` que `get-wallet`/`get-categories`/`get-all`. Esta ruta ya estaba en `.ts` desde antes de Historia 8 (no estaba en su lista de archivos), se encontró y arregló al cerrar la historia. | `87f1ca9` | Crítica |
| 34 | `general-data/income-sources/get` (POST) | Cero verificación de sesión - `const id = await request.json()` a secas trataba el body entero como el email, exponia los income sources de cualquier usuario. | `11c035e` | Alta |
| 35 | `general-data/projections/get` (POST) | Cero verificación de sesión - confiaba en el `mail` del body para buscar la configuración de proyecciones de cualquier usuario. | `1ef4c85` | Alta |
| 36 | `general-data/projection-baseline/get` (POST) | Cero verificación de sesión - confiaba en el `mail` del body para buscar el projection baseline de cualquier usuario. | `7964929` | Alta |

Los #1-5, #7, #9, #16-19 comparten la misma causa raíz (confiar en un `mail`
mandado por el cliente en vez de derivar el usuario de la sesión
autenticada vía `auth.api.getSession()`). El resto (#6, #8, #10-15,
#20-22) son la categoría más grave (cero verificación, ni siquiera de sesión) pero
se corrigen
con el mismo
patrón. Ninguno requirió cambiar el comportamiento de ningún call site
real ya existente.

**Otros bugs (no de seguridad) encontrados y corregidos durante la
migración, fuera de las rutas de arriba**:
- `RegisterComp.jsx`: el input de nombre completo leía `formData.name`
  en vez de `formData.fullName` (Historia 1, arreglado con aprobación
  del usuario, no forma parte del alcance normal de migración).
- Código muerto borrado con aprobación del usuario: `api/searchUser.js/
  route.js` (commit `4e30237`) y el `api/login/route` legacy, huérfano,
  con 3 bugs reales incluyendo cero verificación de credencial (commit
  `5445acc`).

**Bugs preexistentes encontrados y reportados, sin tocar (fuera del
alcance de "solo agregar tipos", pendientes de decisión del usuario)**:
ver las entradas de Historia 1 y 2 arriba (dropdown de periodo del
Dashboard, selectores rotos de Redux en varios slices, `parsedPhone` no
se calcula si el cliente manda `phone` como número en vez de string en
`update-user`, `throw new Error({...})` con un objeto en vez de un
string en varias rutas). Se suma de esta historia: el botón de subida
de imagen dentro de `<CldUploadWidget>` en `ProfileClient.tsx` no tiene
`type` explícito y está dentro del `<form>` del perfil, por lo que por
defecto es `type="submit"` - dar click ahí probablemente también
dispara el submit del formulario (ver ronda de rework de
`ProfileClient.tsx` arriba).

## 2026-09-24 — Historia 3 (Profile) completa: 7/7 archivos

`dashboard/profile/page.tsx`, `ProfileClient.tsx`, `ApiTokensPanel.tsx`
y las 4 rutas de API que usa (`update-user`, `api-tokens/list`,
`api-tokens/new`, `api-tokens/remove`) - todos migrados, revisados y
aprobados. 2 rondas de rework en total (`ProfileClient.tsx` por el
patrón de `|| null`→`|| ""` y el `type="button"` no autorizado;
`api-tokens/new/route.ts` por un fallback `|| {}` no forzado por el
compilador, mismo patrón de fondo). Los 5 bugs de seguridad IDOR de
esta historia (ver tabla consolidada arriba) fueron encontrados y
corregidos por Claude directamente, fuera del flujo normal de
migración, por prioridad urgente pedida por el usuario en cada caso.

**Historia 3 probada end-to-end por el usuario**: confirmado por el
usuario ("al parece jala bien").

## 2026-09-24 — Historia 4 (Componentes compartidos pequeños) completa: 10/10 archivos

`CategoIcon.tsx`, `UniversalCategoIcon.tsx`, `EmptyModule.tsx`,
`Tag.tsx`, `SelecterFilter.tsx`, `SelecterItemsToDisplay.tsx`,
`TimeRange.tsx`, `MultiCreditCard.tsx`, `GoalBudget.tsx`,
`DeletePreviewRow.tsx` - todos migrados, revisados y aprobados. Elegida
esta historia antes que Movements/WalletAnalyzer/Budgets/Categories
(todos 1000+ líneas y muy entrelazados) a propósito: estos 10 archivos
son pequeños y se usan como bridge tipado en casi todo lo ya migrado.

**2 rondas de rework**, mismo patrón de fondo en ambas (auto-imponerse
comportamiento no forzado por el compilador bajo `strict:false`):
- `TimeRange.tsx`: se agregó optional chaining (`?.()`) a dos llamadas
  (`rpDateRef.current(...)`, `rpDate(...)`) que no lo tenían. Verificado
  con test aislado de tsc que no era forzado - cambia un TypeError real
  por un no-op silencioso si `rpDate` no se pasa. Revertido.
- (la otra ronda fue en Historia 3, `api-tokens/new`, ver arriba - se
  repite el patrón aquí por completitud del conteo total de la
  migración: van 5 rondas de rework en total en las 4 historias).

**Hallazgo de bug preexistente confirmado con causa raíz exacta** (no
arreglado, fuera de alcance): en `SelecterFilter.jsx`, dos entradas del
arreglo `periods` por defecto comparten `value: 30` ("Last 30 days" y
"Last 90 days" - typo de copy-paste). Como el `<select>` nativo de HTML
selecciona visualmente la primera `<option>` cuyo `value` coincide, la
etiqueta mostrada queda pegada en "Last 30 days" aunque el usuario elija
"Last 90 days" (los datos sí cambian bien, solo el label visual es
incorrecto). Esto explica el bug del dropdown de periodo del Dashboard
reportado por el usuario en Historia 2. Preservado intacto en la
migración por instrucción explícita - pendiente de que el usuario
decida si lo arregla.

**Historia 4 probada end-to-end por el usuario**: el usuario decidió
posponer las pruebas manuales de esta historia para más adelante (son
componentes chicos, de bajo riesgo, transversales a toda la app) y
seguir avanzando la migración. Pendiente de prueba, no bloquea.

## 2026-09-24/25 — Historia 5 (Accounts) en curso + 6to fix de seguridad urgente, distinto de los anteriores

Migrado el modelo `Account.ts` (mismo patrón que `User.ts`: `IAccount`,
`Schema<IAccount>`, `mongoose.Model<IAccount>`).

**Fix de seguridad crítico, categoría nueva (hecho por Claude
directamente, no por Antigravity)**: revisando las 4 rutas de API de
Accounts antes de migrarlas se encontró que NINGUNA verificaba sesión
en absoluto - a diferencia de los IDOR anteriores (que al menos
confiaban en un `mail` del body), estas simplemente no chequeaban nada.
Y a diferencia de las páginas del dashboard, `middleware.ts` solo
protege `/dashboard/:path*` - las rutas de API no están cubiertas por
el matcher - así que las 4 eran alcanzables por cualquiera, ni siquiera
hacía falta estar autenticado:

- `remove-account`: borraba CUALQUIER cuenta de la base de datos dado
  solo su id, sin ninguna verificación. El más grave: borrado
  destructivo sin ningún control de acceso.
- `update-account`: editaba nombre/monto/tipo/moneda de CUALQUIER
  cuenta, sin ninguna verificación.
- `new-account`: creaba una cuenta falsa dentro del wallet de
  CUALQUIER OTRO usuario (el cliente mandaba `userId`/`walletId`
  directo en el body).
- `reorder`: ya acotaba su `Account.updateOne` a un `walletId`, pero
  ese `walletId` salía de un `mail` del body sin verificar sesión -
  mismo patrón que los IDOR anteriores, menos grave que los otros 3.

Las 4 rutas ahora exigen `auth.api.getSession(request.headers)` y
resuelven el wallet/usuario del caller del lado del servidor;
`update-account`/`remove-account` además acotan el `Account` buscado a
`{ _id, wallet }` propio, así que un id de la cuenta de otra persona
falla con el mismo "no encontrado" que un id inventado. Los call sites
reales (`EditAccountModal.jsx`, `MultiCreditCard.tsx`) siempre operan
sobre la cuenta/wallet propios, cero cambio de comportamiento legítimo.
Se actualizaron los tests unitarios existentes de `update-account` y
`new-account` para mockear las nuevas dependencias (`User`,
`betterAuth`) y el cambio de `Account.findById` a `Account.findOne`.

Verificado en vivo en Chrome de punta a punta: se creó una cuenta de
prueba ("TS Security Test Account") vía `new-account`, se editó su
balance vía `update-account`, y se borró vía `remove-account` - las 3
respetando la sesión correctamente. `reorder` comparte exactamente el
mismo patrón y pasa sus tests, no se probó con drag-and-drop en vivo
por tiempo.

Migradas las 4 rutas de `accounts/*` a TypeScript (con el fix de
seguridad ya intacto): `reorder.ts`, `update-account.ts` (la comparación
`,` → `;` en las asignaciones de `findAccount` es el operador coma de
JS, cero cambio de comportamiento), `new-account.ts` (bridge tipado
para `Wallet.js` sin migrar), `remove-account.ts`.

**7mo y 8vo fix de seguridad, encontrados al revisar la dependencia de
`PrimaryCurrencySelector.jsx` antes de migrarlo (hechos por Claude
directamente)**: el componente llama a `general-data/wallet/get-wallet`
y `general-data/wallet` (POST) - ambas rutas tenían el mismo problema:

- `get-wallet` (ya migrada en Historia 2 - **se me pasó en esa
  revisión**): confiaba en el `mail` del body, mismo IDOR de lectura ya
  visto en `get-user`. Cualquier usuario autenticado podía leer el
  wallet completo (presupuesto, cash, moneda) de cualquier otro.
- `wallet/route.js` (POST, sin migrar todavía): cero verificación de
  sesión - actualizaba nombre/cash/presupuesto/moneda de CUALQUIER
  wallet dado su `walletId` del body, sin auth de ningún tipo.

Ambas corregidas con el mismo patrón (`auth.api.getSession()` +
resolver el wallet del lado del servidor). Se actualizó
`wallet/route.test.js` para mockear `User`/`betterAuth`. Verificado en
vivo en Chrome: `get-wallet` cargó bien el wallet real, y se cambió la
moneda primaria de MXN a USD y de vuelta a MXN vía
`PrimaryCurrencySelector`, ambos confirmados con toast.

**El usuario pidió, aparte de la migración, una auditoría completa de
TODOS los endpoints de la API** para confirmar que tienen la
verificación de sesión correcta - se creó
[`api-security-audit-checklist.md`](api-security-audit-checklist.md)
con un escaneo heurístico de las ~65 rutas existentes y una lista de
pendientes por revisar manualmente. Es una tarea aparte, no bloquea
seguir con la migración.

---

## Bugs pendientes (encontrados, NO arreglados, para revisión posterior del usuario)

Esta tabla se actualiza cada vez que se encuentra un bug real fuera del
alcance de "solo agregar tipos" (regla de oro de esta migración). Nada
de aquí se toca sin que el usuario lo pida explícitamente.

| # | Dónde | Bug | Historia donde se encontró |
|---|-------|-----|------|
| 1 | `SelecterFilter.jsx` (ahora `.tsx`) | Dropdown de periodo del Dashboard muestra la etiqueta equivocada - dos opciones del arreglo por defecto comparten `value: 30` ("Last 30 days" y "Last 90 days", typo de copy-paste). El `<select>` nativo pinta la etiqueta de la primera opción que matchea ese value, aunque los datos sí cambien bien. | Historia 2 (reportado) / Historia 4 (causa raíz confirmada) |
| 2 | `update-user/route.ts` | Si el cliente manda `phone` como número en vez de string, `parsedPhone` queda `undefined` y cae al valor previo (nunca se actualiza el teléfono en ese caso). | Historia 3 |
| 3 | Varias rutas (`update-user`, `get-user`, etc.) | `throw new Error({...})` pasa un objeto en vez de un string al constructor de `Error`, dando `"[object Object]"` como mensaje real en vez de un mensaje legible. | Historia 1 / Historia 3 |
| 4 | `ProfileClient.tsx` | El botón de "Upload an Image" dentro de `<CldUploadWidget>` no tiene `type` explícito y está dentro del `<form>` del perfil - por defecto es `type="submit"`, así que dar click ahí probablemente también dispara el submit del formulario. | Historia 3 |
| 5 | `walletSlice.ts`, `categoriesSlice.ts`, `subCategorySlice.ts`, `transacctionsSlice.ts` | Varios selectores de Redux rotos: leen la ruta equivocada del state (ej. `state.accounts.*` en vez de `state.wallet.*`) o regresan el state completo sin filtrar. Parecen no usarse en ningún lado activo (o el bug nunca se manifestó), pero están mal. | Historia 2 |
| 6 | `lib/asyncThunk.ts` | Archivo 100% boilerplate de tutorial de Redux Toolkit, nunca conectado al store real - candidato a borrar por completo. | Historia 2 |
| 7 | `Dashboard.tsx` (ya migrado, comportamiento preservado) | `allBills`/`allIncomes` solo se referencian dentro de un bloque JSX ya comentado; `handleDurationChange`/`setSelectedDuration` están completamente muertos. No se tocaron por regla, pero son candidatos a limpieza. | Historia 2 |
| 8 | `UniversalCategoIcon` (llamadas en `CategoryList.tsx`/`SubCategoryList.tsx`/`EditCategoryModal.tsx`) | Varias llamadas mandan `size={40}` en vez de `siz={40}` (el prop real que espera `UniversalCategoIcon`) - typo preexistente, el ícono nunca recibe tamaño explícito. Se preservó tal cual en las 3 migraciones, no se corrigió. | Historia 6 |
| 9 | `subcategory/remove/route.ts` | Si `removeSub` es `null`, `removeSub.name` dentro del `if (!removeSub)` lanza un `TypeError` real (atrapado por el catch) antes de llegar al fallback `|| "SubCategory"`. | Historia 6 |
| 10 | `BudgetDetailModal.tsx` | El botón "Delete transaction" de este modal llama `handleRemoveTrans`, que hace `fetcher.post(...)` directo sobre el módulo importado en vez de sobre la instancia `fetcher()`. `fetcher.post` es `undefined`, así que SIEMPRE lanza `TypeError` (atrapado por el catch, muestra toast de error) - pero `dispatch(removeOneTransacction(id))` ya se ejecutó antes de forma optimista, así que el movimiento desaparece de la UI aunque nunca se borra en el backend (reaparece al refrescar). agy lo "arregló" solo durante la migración (cambiándolo a `fetcher().post(...)`, que sí funcionaría); se revirtió en rework para preservar el comportamiento original exacto vía un bridge tipado, tal como pide la regla de oro. | Historia 7 |
| 11 | `EditSingleTransModal.tsx` | Un `<Space direction="" size={12}>` (string vacío, prop inválida) hace que Antd nunca aplique su clase real `ant-space-horizontal` ni el `align: center` automático - el default `direction = 'horizontal'` de Antd solo aplica cuando la prop es `undefined`, no `""`. Se dispara siempre que se renderiza ese bloque (no es un edge case). agy lo "arregló" solo cambiándolo a `direction="horizontal"`; se revirtió en rework a `direction={"" as "horizontal"}` para preservar el bug visual exacto. | Historia 8 |
| 12 | `EditMultipleTransModal.tsx` | El `<option value="">No account</option>` no coincide con el check `e.target.value === "No account"` de `handleDefAccount` (nunca es igual), así que seleccionar "No account" guarda `account: ""` en vez de `null` - el editor masivo nunca puede desvincular la cuenta de varias transacciones a la vez. | Historia 8 |
| 13 | `ReadFileComp.tsx` | `useSelector(state => state.userReducer.data)` da el `UserData` plano, no el slice `{data, status, error}`, así que `ccUser.status` siempre es `undefined` y el `if (ccUser.status == "idle")` nunca dispara `fetchUser` desde este componente (código muerto - no causa problema visible porque `MovementsClient` ya lo dispara por su cuenta). | Historia 8 |
| 14 | `transactions/edit-many/route.ts` | Los tags nuevos creados durante un bulk-edit se guardan sin campo `wallet` (`Tag.create({name, user})`, sin `wallet`) - inconsistente con `transactions/[id]/route.ts`, que sí le pone `wallet` a los tags nuevos. Como el schema de `Tag` tiene el mismo typo `require` (no `required`) que otros modelos, Mongoose no lo rechaza. | Historia 8 |
| 15 | `HistoryClient.tsx` | `setUser(ccUser.data)` se llama directo sin `dispatch(...)` en el useEffect que sincroniza el usuario - el mismo patrón no-op ya visto en `CategoriesClient.tsx` (Historia 6). Nunca actualiza el store de verdad; el resto del efecto (`setIsLoading(false)`) sí funciona. | Historia 10 |
| 16 | `TabsTogglerMontlyController.tsx` | `setTransacctions(ccTransacciones.data)` se llama directo sin `dispatch(...)` - 4ta ocurrencia del mismo patrón no-op (`CategoriesClient.tsx` en Historia 6, `HistoryClient.tsx` en Historia 10). Nunca actualiza el store de transacciones desde este componente. | Historia 10 |
| 17 | `usePeriodComparison.ts` | `const today = new Date()` se evalúa una sola vez a nivel de módulo, no en cada render/uso. Si la sesión SPA se mantiene abierta cruzando la medianoche sin recargar, el rango default "Last 3 months" del selector de periodo queda congelado a la fecha en que el bundle se cargó. | Historia 10 |
| 18 | `usePeriodComparison.ts` | `comparePeriod` solo se calcula una vez al montar (año anterior sobre el default "Last 3 months", via `useState(() => ...)`). Si el usuario cambia `timePeriod` desde el selector y luego activa "Compare", `comparePeriod` sigue apuntando al periodo inicial en vez de recalcularse sobre el nuevo `timePeriod` - a menos que el usuario lo ajuste manualmente. | Historia 10 |
| 19 | `timeFunctions.ts` | `const year = new Date().getFullYear()` a nivel de módulo alimenta `timeperiodRangesArray` (los rangos de trimestre/semestre/año del selector) - mismo patrón que el bug #17: si la sesión SPA queda abierta cruzando el 1 de enero, estos rangos quedan congelados al año en que se cargó el bundle. | Historia 10 |
| 20 | `timeFunctions.ts` | `generate_timeperiod_ranges_array_for_dashboard(year)` ignora su propio parámetro `year` en la entrada "Last 3 months" (usa `new Date().getFullYear()` en su lugar), mientras las demás entradas de la misma función sí respetan `year` - inconsistente si algún caller pide un año distinto al actual. | Historia 10 |
| 21 | `timeFunctions.ts` | `getYearMonthDateRange` define su propia paleta de 12 colores hexadecimales para los meses, distinta a la paleta de `monthObjects` usada en otras vistas (ej. "january" es `#fbcfc6` en una y otro hex en la otra) - el mismo mes puede pintarse con colores distintos según qué función alimentó esa vista. | Historia 10 |
| 22 | `CategoryCirclePacking.tsx` | El tooltip calcula `(dataa.value / totalValueOn) * 100` sin proteger contra `totalValueOn === 0` (estado inicial antes de que el `useEffect` calcule el total, o un set de transacciones con valor 0) - en ese caso muestra literalmente "NaN%" o "Infi%" en vez de un porcentaje. | Historia 11 |
| 23 | `CategoryCirclePacking.tsx` (y por herencia cualquier consumidor de `buildCategoryHierarchy`) | `buildCategoryHierarchy()` genera nombres de ícono sin prefijo de colección (ej. `"MdFilterNone"`), pero `UniversalCategoIcon` espera el formato `"coleccion/NombreIcono"` (ej. `"md/MdFilterNone"`) - el ícono de esas categorías/subcategorías se resuelve a `null` silenciosamente, sin ícono visible. | Historia 11 |
| 24 | `TransResumeChart.tsx` | Al construir el nivel de subcategoría, `traSub.category._id` se lee sin `?.` (el filtro `transWithSubCat` solo exige `subCategory` truthy, no `category`) - una transacción con subcategoría pero sin categoría lanza un `TypeError` real en runtime, no atrapado por ningún try/catch. Estuvo a punto de "arreglarse" por accidente durante la migración (agregando `?.` al tipar) y se revirtió explícitamente en rework para preservar el crash original. | Historia 11 |
| 25 | `TransResumeChart.tsx` | Mismo patrón que el bug #22 (división por cero en el tooltip: `(dataa.value / totalValueOn) * 100` sin proteger `totalValueOn === 0`, muestra "NaN%"). | Historia 11 |
| 26 | `TransResumeChart.tsx` | `arcLabel={(e) => e.id + " ( $" + e.value + ")"}` usa el símbolo `$` fijo en vez del helper de formateo multi-moneda (`formatMoneyMajor`) que sí se usa en el resto del componente - las etiquetas del sunburst siempre muestran `$` aunque la wallet use otra moneda primaria. | Historia 11 |
| 27 | `HistoricalComparativeCategories.tsx` | `setUser(ccUser.data)` se llama directo sin `dispatch(...)` - 5ta ocurrencia del mismo patrón no-op (`CategoriesClient.tsx` Historia 6, `HistoryClient.tsx` Historia 10, `TabsTogglerMontlyController.tsx` Historia 10). Nunca actualiza el store de usuario desde este componente. | Historia 11 |
| 28 | `HistoricalComparativeCategories.tsx` | `setTransacctions(ccTransacciones.data)` se llama directo sin `dispatch(...)` - 6ta ocurrencia del mismo patrón no-op. Nunca actualiza el store de transacciones desde este componente. | Historia 11 |
| 29 | `budgetTypes.ts` | `getBudgetType()` solo evalúa `isSaving === true` y `budgetType === "project"`, pero no tiene rama explícita para `budgetType === "saving"` - un budget con `budgetType: "saving"` pero `isSaving` falso/ausente se clasifica como "spending" en vez de "saving". | Historia 12 |
| 30 | `budgetHistoricalComparative.ts` | `getEarliestKnownGoal()` no protege contra `effectiveFrom` inválido/ausente en `budget.history` - `new Date(undefined)` da `Invalid Date`, la comparación `NaN < Date` siempre es `false`, y el resultado final también queda como `Invalid Date`. | Historia 12 |
| 31 | `budgetHistoricalComparative.ts` | `resolveMonthlyGoalAmount()` marca `estimated: false` incorrectamente cuando un budget no tiene `history` NI `createdAt` (ej. documentos viejos o mocks de test) - `earliestFrom` queda `null`, por lo que meses anteriores a la existencia real del budget no se etiquetan como estimados. | Historia 12 |
| 32 | `budgetHistoricalComparative.ts` | El `rows.sort((a, b) => (a.complianceRate ?? 1) - (b.complianceRate ?? 1))` no tiene criterio de desempate para budgets con el mismo `complianceRate` - el orden entre ellos depende del algoritmo de sort del motor JS, no es determinista de forma explícita. | Historia 12 |
| 33 | `BudgetHistoricalComparativeRow.tsx` | Al presionar la barra espaciadora sobre una fila (navegación por teclado), `onOpenDetail(row)` se dispara pero falta `e.preventDefault()` - el navegador puede hacer scroll de la página al mismo tiempo que se abre el modal de detalle. | Historia 12 |
| 34 | `BudgetHistoricalComparativeRow.tsx` | Cuando `complianceRate` es `null` (`monthsTracked === 0`), `(complianceRate \|\| 0) * 100` muestra "0% compliance" en rojo, indistinguible visualmente de un budget que de verdad se cumplió 0% de las veces, en vez de indicar "sin datos". | Historia 12 |
| 35 | `BudgetHistoricalDetailModal.tsx` | Si `walletPrimaryCurrency` llega `undefined` o con un código no soportado, `formatMoneyMajor` lanza `Error: Unsupported currency: undefined` - el componente no tiene ningún fallback interno (a diferencia de otros lugares del código que sí hacen `|| "MXN"`). | Historia 12 |
| 36 | `TransferExchangeModal.tsx` | `MobileDateTimePicker`'s `onChange` llama `newValue.format()` sin proteger contra `null` - si el usuario limpia el campo de fecha, lanza un `TypeError` real en runtime. Estuvo a punto de "arreglarse" por accidente durante la migración (agregando `if (newValue)` al tipar) y se revirtió explícitamente en rework para preservar el crash original. | Historia 13 |
| 37 | `TransferExchangeModal.tsx` | El payload de `handleSubmit` manda `user: user._id, wallet: user.wallet` sin ningún guard - si `user` fuera `null`/`undefined` al momento de enviar una transferencia, lanza un `TypeError` real en runtime. También estuvo a punto de "arreglarse" por accidente (agregando `?.`) y se revirtió en rework - es el submit de una transferencia de dinero real, por lo que el comportamiento exacto importa especialmente aquí. | Historia 13 |
| 38 | `TransferExchangeModal.tsx` | `EMPTY_FORM.date` se evalúa una sola vez a nivel de módulo (`new Date()` al cargar el bundle) - `clearForm()` restablece el campo de fecha al momento en que se cargó el módulo, no al momento actual, en una sesión SPA larga. | Historia 13 |
| 39 | `TransferExchangeModal.tsx` | El flag `destinationTouched` es "pegajoso": una vez que el usuario edita manualmente el monto destino, cambiar la cuenta origen/destino o el monto origen ya no vuelve a autocompletar la cotización de cambio de divisa - el usuario tiene que usar "Clear Form" para reactivarla. | Historia 13 |
| 40 | `TransferExchangeModal.tsx` | `majorToMinor()` redondea con `Math.round` - un monto menor a la unidad menor de la moneda (ej. $0.001 USD) se redondea a 0 y la validación `!(sourceAmountMinor > 0)` bloquea el submit con "Enter both amounts", aunque el usuario sí haya escrito un monto. | Historia 13 |
| 41 | `Navbar.tsx` | `useSelector((state) => state.userReducer.data)` da el `UserData` plano, no el slice `{data, status, error}` - `ccUser.status` siempre es `undefined` (el campo real vive en `state.userReducer.status`, no dentro de `.data`), así que `if (ccUser.status == "idle")` nunca dispara `fetchUser` desde Navbar. Mismo patrón raíz que el bug #13 (`ReadFileComp.tsx`, Historia 8), ocurrencia nueva en archivo distinto - no causa problema visible porque otros componentes ya disparan `fetchUser` por su cuenta. | Historia 13 |

Bugs que SÍ se corrigieron (ya no están pendientes, solo para contexto):
22 bugs de seguridad de control de acceso en `get-user`, `update-user`,
`api-tokens/list`, `api-tokens/new`, `api-tokens/remove`, las 4 rutas
de `accounts/*`, `get-wallet`/`wallet`, las 7 rutas de
`categories/*`/`subcategory/*`, `get-categories`/`get-sub-categories`,
y las 5 rutas de `budget/*` (ver tabla consolidada arriba); 2 archivos
muertos borrados; **3 bugs
reales de `CategoriesClient.tsx` arreglados a petición explícita del
usuario el 2026-09-25 (commit `ef2059c`)** - dispatch faltante en
`setCategories`/`setSubCategories` (resuelto ordenando localmente en
vez de tocar el store compartido, para no arriesgar un loop infinito ni
afectar a Dashboard/Movements que leen el mismo state), las 4
condiciones `.length < 0` cambiadas a `.length === 0`, y "Default Sub
Categories" ahora lee `ccSubCategories.data.default` (que sí se
guardaba pero nunca se leía) en vez de duplicar "Default Categories"
(`api/searchUser.js`, `api/login` legacy); 1 bug de UI en
`RegisterComp.jsx` (`formData.name` → `formData.fullName`).

**Nota sobre los review misses repetidos**: `get-wallet`,
`get-categories` y `get-sub-categories` fueron los 3 migrados en
Historia 2 sin que Claude cachara el mismo patrón de IDOR que sí se
detectó en Historia 1 (`get-user`). Los 3 comparten la misma forma
exacta (`const userMail = await request.json(); User.findOne({mail:
userMail})`) - un patrón que ya debería reconocerse a simple vista de
aquí en adelante.

**Pendiente aparte, no bloquea la migración**: auditoría completa de
todos los endpoints de la API pedida por el usuario - ver
[`api-security-audit-checklist.md`](api-security-audit-checklist.md).

## 2026-09-25 — Historia 5 (Accounts) completa: 9/9 archivos

`Account.ts` (modelo), las 4 rutas de API (`reorder`, `update-account`,
`new-account`, `remove-account`, todas con el fix de seguridad ya
intacto), `PrimaryCurrencySelector.tsx`, `EditAccountModal.tsx`,
`AccountClient.tsx` (el archivo más grande de esta historia, 447
líneas) y `accounts/page.tsx` - todos migrados, revisados y aprobados,
0 rondas de rework.

**2 fixes de seguridad más encontrados en el camino** (7mo y 8vo de la
migración, ver tabla consolidada): `get-wallet` (IDOR de lectura, un
review miss real de Historia 2) y `wallet/route.js` (cero sesión). Ver
sección anterior para el detalle completo.

**Limpieza de código muerto confirmada en `AccountClient.tsx`**: un
import de `TransDetailsGrandContainer` nunca usado, variables
`accBills`/`accIncomes` calculadas pero nunca leídas, y un
`handleChange` que nunca se llamaba y referenciaba variables
(`userInfo`/`setUserInfo`) que ni siquiera existían en el archivo -
hubiera sido un `ReferenceError` en tiempo de ejecución si alguna vez
se hubiera invocado. Los tres confirmados como código 100% muerto antes
de aprobar su eliminación.

**Historia 5 probada end-to-end en vivo por Claude durante los propios
fixes de seguridad** (crear/editar/borrar cuenta, cambiar moneda
primaria, ver el resumen de transacciones y el treemap de categorías) -
pendiente de que el usuario la pruebe también por su cuenta cuando
quiera.

## 2026-09-25 — Historia 6 (Categories) en curso + 9no al 15vo fix de seguridad

Antes de migrar las 7 rutas de categorías/subcategorías de esta
historia, se revisaron a mano (mismo hábito que en Historias 3 y 5) y
las 7 tenían el mismo problema de fondo, cero verificación de sesión:

- `categories/get-all`: confiaba en un `mail` del body (IDOR de
  lectura). Sin call site real en el frontend (código muerto desde ese
  punto de vista), pero sigue siendo alcanzable por HTTP directo.
- `categories/new-category`, `subcategory/new`: tomaban `user`/`wallet`
  directo del body del cliente - se podia plantar una categoria/
  subcategoria dentro del wallet de CUALQUIER OTRO usuario.
- `categories/update-category`, `categories/remove-category`,
  `subcategory/update`, `subcategory/remove`: buscaban el recurso solo
  por `id`, cero verificacion de dueño - se podia editar o borrar la
  categoria/subcategoria de CUALQUIER usuario. `subcategory/update` es
  el mas delicado: cambiar el `fatherCategory` dispara un
  `Transaction.updateMany` que re-etiqueta todas las transacciones bajo
  esa subcategoria - sin verificar dueño, alguien podria re-categorizar
  transacciones ajenas.

Las 7 corregidas con el mismo patron ya usado 8 veces antes: derivar
usuario/wallet de `auth.api.getSession()`, y las rutas que mutan
acotan su busqueda de `Category`/`SubCategory` a `{ _id, wallet }`
propio. Verificado en vivo en Chrome de punta a punta: se creo, edito
y borro una categoria de prueba, y se creo, re-parenteo (cambio de
categoria padre) y borro una subcategoria de prueba - todo respetando
la sesion correctamente.

Con esto van 15 rutas con este mismo bug de fondo corregidas en la
migracion (ver tabla consolidada mas abajo, actualizada).

Al revisar `get-categories`/`get-sub-categories` (ya migradas en
Historia 2) por el mismo motivo, se confirmó el mismo review miss que
`get-wallet` - IDOR de lectura idéntico, mismas dos rutas corregidas
(16to y 17mo fix, commit `e49f66e`).

## 2026-09-25 — Historia 6 (Categories) completa: 20/20 archivos

Modelos `Category.ts`/`SubCategory.ts`, las 7 rutas CRUD (ya con los
fixes de seguridad intactos), `useModalBasic.ts`,
`SelectCategories.tsx`/`SelectCategoryProvider.tsx`,
`IconDisplayerMenu.tsx`, `BasicModal.tsx`, `ModalCategoryContent.tsx`,
`CategoryList.tsx`, `SubCategoryList.tsx`, `EditCategoryModal.tsx` (el
más grande de la historia, 527 líneas), `CategoriesClient.tsx` y
`categories/page.tsx` - todos migrados, revisados y aprobados.

**2 rondas de rework, mismo bug de fondo nuevo en esta historia**: en
`CategoryList.tsx`, Antigravity cambió `size={40}` a `siz={40}` en una
llamada a `UniversalCategoIcon` - parecía un simple rename de tipos,
pero `UniversalCategoIcon` real espera `siz`, no `size`; el original
SIEMPRE tuvo el typo `size` (ignorado silenciosamente, el ícono nunca
tenía tamaño explícito), así que renombrarlo activaba visualmente el
tamaño por primera vez - un cambio de comportamiento real. Se verificó
que quitar la prop por completo (sin reemplazo) también compila limpio,
confirmando que el rename no era forzado. El mismo problema volvió a
aparecer en `EditCategoryModal.tsx` con una prop `color` inválida en
otra llamada a `UniversalCategoIcon` - ahí Antigravity ya lo hizo bien
solo (quitarla, no renombrarla a `colore`), y en `SubCategoryList.tsx`
tras advertirle explícitamente del patrón, también lo hizo bien a la
primera. `EditCategoryModal.tsx` tuvo además su propia ronda de rework
por el patrón de siempre (auto-imponerse `|| ""` en vez de `|| null`, y
un `setActive(ecmMode || false)` no forzado que habría normalizado
cualquier valor falsy de `ecmMode` a `false` en vez de dejarlo pasar
tal cual).

**4 bugs reales preexistentes encontrados y confirmados en
`CategoriesClient.tsx`** (ver tabla de bugs pendientes, filas 8-10):
`setCategories`/`setSubCategories` llamados sin `dispatch(...)` (nunca
actualizan el store de verdad), 4 condiciones `.length < 0` que nunca
se cumplen, y la sección "Default Sub Categories" que renderiza
exactamente el mismo componente y dato que "Default Categories" arriba
(copy-paste bug real). Ninguno se tocó, todos preservados y reportados.

**Historia 6 probada end-to-end en vivo por Claude**: crear una
categoría de prueba completa (nombre, ícono vía `IconDisplayerMenu`,
color vía `ColorPicker`) y borrarla - toasts de éxito confirmados en
cada paso, sin errores de consola. Pendiente de que el usuario la
pruebe también por su cuenta.

## 2026-09-25 — Historia 7 (Budgets) completa: 12/12 archivos

Modelo `Budget.ts` (se preservó a propósito su patrón inusual de
re-registro con `delete mongoose.models.Budget` antes de
`mongoose.model(...)`, distinto al resto de modelos del proyecto), las
4 rutas `budget/new`/`update`/`remove`/`get-historical` (`budget/get`
ya estaba migrada desde Historia 2), `BudgetBarRow.tsx`,
`BudgetEditModal.tsx`, `BudgetDetailModal.tsx`,
`ProjectBudgetDetailModal.tsx`, `SpendingSummaryDetailModal.tsx`,
`BudgetsClient.tsx` (la más grande de la historia, ~500 líneas) y
`dashboard/budgets/page.tsx` - todos migrados, revisados y aprobados.

**2 rondas de rework:**
- `BudgetEditModal.tsx`: 3 cambios de comportamiento no forzados por el
  compilador (verificado revirtiendo cada uno y corriendo `tsc`
  limpio): `goalAmount`/`savingAmount` cambiados de `|| ""` a `?? ""`
  (un budget con monto exactamente 0 pasaría de mostrar el input vacío
  a mostrar "0"), y dos ocurrencias de un ternario `catObj?.icon !==
  undefined ? catObj.icon : (...)` en vez del `catObj?.icon || null`
  original. Los tres se revirtieron.
- `BudgetDetailModal.tsx`: reapareció el bug de typo `size`→`siz` en
  `CategoIcon` (mismo patrón ya visto 3 veces en Historia 6, a pesar de
  la advertencia explícita en el prompt) - se revirtió quitando el prop
  en vez de renombrarlo. Más importante: Antigravity encontró un bug
  real preexistente en `handleRemoveTrans` (el botón "Delete
  transaction" llamaba `fetcher.post(...)` directo sobre el módulo
  importado en vez de sobre la instancia `fetcher()`, algo que siempre
  ha lanzado `TypeError` en runtime) y lo arregló solo, violando la
  regla de oro de "reportar, no arreglar". Se revirtió a un bridge
  tipado que preserva el `TypeError` original exacto, y el bug quedó
  documentado en la tabla de bugs pendientes (fila 10) para que el
  usuario decida si arreglarlo aparte.

**Bug real nuevo, NO arreglado** (ver tabla de bugs pendientes, fila
10): en `BudgetDetailModal.tsx`, borrar un movimiento desde ese modal
específico nunca ha funcionado - el backend nunca recibe la petición de
borrado (tira `TypeError` atrapado por el catch, solo muestra un toast
de error), pero el movimiento sí desaparece de la UI porque el
`dispatch(removeOneTransacction(id))` optimista ya se ejecutó antes.
Reaparece al refrescar la página.

`BudgetsClient.tsx` y `ProjectBudgetDetailModal.tsx` y
`SpendingSummaryDetailModal.tsx` y `dashboard/budgets/page.tsx` no
tuvieron rework - limpios a la primera.

## 2026-09-28/29 — Historia 9 (Wallet Analyzer) completa: 20/20 archivos

(Registro retroactivo breve - el resumen completo vive en
`migration-typescript.md`.) El widget de análisis financiero del
Dashboard completo: `WalletAnalyzer`/`WalletAnalyzerTeaser`/
`WalletAnalyzerView` [812→1157 líneas]/`WalletAnalyzerTrendChart`/
`WalletAnalyzerInsightsStrip`/`WalletAnalyzerProjectionCard`/
`WalletAnalyzerWeekdayChart`/`MonthlyChampionsModal`/
`InsightDetailModal`/`WeekdaySpendingDetailModal`, el transformer
`walletAnalyzer.ts` [1500→2273 líneas, revisado función por función,
su test suite de 1129 líneas siguió pasando 76/76 idéntico],
`useAccountsFxExposure`, los modelos `FxRateSnapshot`/`IncomeSource`/
`ProjectionSettings`/`ProjectionBaseline`, y las 4 rutas de lectura
`income-sources/get`/`projections/get`/`projection-baseline/get`/
`fx/quote`. **Cero rondas de rework en toda la historia** - la más
limpia hasta ahora. Fixes de seguridad #34-36 (mismo IDOR clásico de
`mail`/`id` sin sesión en las primeras 3 rutas); `fx/quote` confirmada
correctamente como pública, sin fix necesario.

## 2026-09-29 — Historia 10 (History) completa: 16/16 archivos

La página de comparativas históricas completa: `dashboard/history/page.tsx`,
`HistoryClient.tsx`, la variante "History" de Wallet Analyzer
(`HistoricalWalletAnalyzer.tsx` [836→943 líneas], `HistoricalProjectionsTable.tsx`,
`BudgetPeriodDetailModal.tsx`), `TabsToggler.tsx`/
`TabsTogglerMontlyController.tsx`/`TabsTogglerMontlyView.tsx`,
`DashboardLoadingMessage.tsx`, `usePeriodComparison.ts`,
`budgetHistory.ts`, `timeFunctions.ts` [309→360 líneas, compartido por
docenas de consumidores en toda la app - la migración de mayor
alcance/riesgo de la historia], `useGetInfoFromProvider.ts`,
`PeriodFiltersWithCompare.tsx`, `useProjectionTable.ts` [248→421
líneas], `ProjectionsView.tsx`.

Historia puramente de UI/lógica de cliente - todos los modelos y rutas
que este árbol necesita ya estaban migrados desde Historia 9, así que
**sin fixes de seguridad nuevos**.

**1 ronda de rework**: `budgetHistory.ts` traía un `[key: string]: any`
no justificado en un index signature de `HistoryEntryWithDates` que
ningún consumidor TypeScript real necesitaba todavía (a diferencia del
`any` legítimo de `TabsToggler.tsx`, justificado porque cada entrada
real del array tiene un shape distinto) - se quitó, el genérico
`T extends {...}` se sigue infiriendo solo del array real que se le
pasa.

**Bugs no-seguridad encontrados y preservados sin arreglar** (ver tabla
de bugs pendientes, filas 15-21): 2 ocurrencias más del patrón "Redux
action creator sin `dispatch()`" (`setUser` en `HistoryClient.tsx`,
`setTransacctions` en `TabsTogglerMontlyController.tsx` - 3ra y 4ta
ocurrencia del mismo patrón visto por primera vez en
`CategoriesClient.tsx`, Historia 6); `today`/`year` congelados a nivel
de módulo en `usePeriodComparison.ts` y `timeFunctions.ts` (mismo
patrón en ambos - una sesión SPA larga que cruce medianoche/año nuevo
usa una fecha base obsoleta); `comparePeriod` que no se resincroniza
cuando el usuario cambia `timePeriod` después del montaje inicial;
`generate_timeperiod_ranges_array_for_dashboard` ignorando su propio
parámetro `year` en la entrada "Last 3 months"; una paleta de colores
de mes distinta entre `getYearMonthDateRange` y `monthObjects` para el
mismo mes.

13 de los 16 archivos limpios a la primera revisión (incluyendo el
hook grande `useProjectionTable.ts` de 421 líneas y el transformer
compartido `timeFunctions.ts`), 2 archivos triviales de 1 línea de
cambio real (`DashboardLoadingMessage.tsx`, `TabsTogglerMontlyView.tsx`),
y solo `budgetHistory.ts` necesitó 1 ronda de rework.

## 2026-09-29 — Historia 11 (Categories analytics) completa: 10/10 archivos

Dos árboles migrados. El primero, la sección "Category Details" del
Dashboard (3 tabs Treemap/Bubble/Nested Pie):
`TransDetailsGrandContainer.tsx`, `DisplayerCategoryTreemap.tsx`,
`CategoryTreemap.tsx` [666→819 líneas, el hand-rolled squarified
treemap - revisado carácter por carácter contra el original en sus 4
secciones críticas (`worstRatio`/`squarify`, `TreemapTile`,
`transactionNode`, el JSX de renderizado final), cero diferencias más
allá de anotaciones de tipo], `DisplayerCategoryCirclePacking.tsx`,
`CategoryCirclePacking.tsx` [Nivo `ResponsiveCirclePacking`, tipos
oficiales del paquete], `TransactionsResumeCont.tsx`,
`TransResumeChart.tsx` [Nivo `ResponsiveSunburst`, también tipos
oficiales]. El segundo, la comparativa histórica de categorías en
`/dashboard/history` que había quedado explícitamente excluida de
Historia 10 como "árbol pesado, historia futura":
`HistoricalComparativeCategories.tsx`, `CategoriesCompareTable.tsx`,
`HistoricalComparativeCategoriesView.tsx`.

Historia puramente de UI/lógica de cliente - todos los modelos y rutas
que este árbol necesita ya estaban migrados en historias anteriores,
así que **sin fixes de seguridad nuevos**.

**1 ronda de rework, la más significativa hasta ahora por lo sutil del
hallazgo**: en `TransResumeChart.tsx`, al construir el nivel de
subcategoría, el original leía `traSub.category._id` sin `?.` - como el
filtro `transWithSubCat` solo exige `subCategory` truthy (no
`category`), una transacción con subcategoría pero sin categoría
lanzaba un `TypeError` real en runtime, un bug preexistente real. La
migración agregó `cat?._id` (con el cast `const cat = traSub.category
as TransCategoryRef`) - el `?.` no era requerido por el compilador (el
cast ya tipa `cat` como no-opcional), y silenciosamente convirtió el
crash original en un `fatherId: undefined` sin errores. El propio
resumen de la migración decía haber preservado el bug intacto, pero no
era cierto - se detectó en la revisión independiente comparando línea
por línea contra el original, y se corrigió a `cat._id` (sin `?.`) para
restaurar el crash exacto. Este caso queda como el ejemplo de referencia
de por qué cada `?.` nuevo debe verificarse dos veces contra el original
antes de aceptarlo.

**Bugs no-seguridad encontrados y preservados sin arreglar** (ver tabla
de bugs pendientes, filas 22-28): 2 ocurrencias más del patrón "Redux
action creator sin `dispatch()`" (`setUser`/`setTransacctions` en
`HistoricalComparativeCategories.tsx` - 5ta y 6ta ocurrencia de toda la
migración); 2 divisiones por cero en tooltips de Nivo que muestran
"NaN%" (`CategoryCirclePacking.tsx` y `TransResumeChart.tsx`, mismo
patrón en ambos); un formato de ícono inconsistente entre
`buildCategoryHierarchy()` y `UniversalCategoIcon` que hace que el
ícono se resuelva a `null` silenciosamente; un símbolo `$` fijo en
`TransResumeChart.tsx` que ignora la moneda primaria real de la
wallet; y el `TypeError` de `traSub.category._id` ya descrito arriba
(que casi se pierde durante la migración).

9 de los 10 archivos limpios a la primera revisión (incluyendo el
archivo más grande y riesgoso, `CategoryTreemap.tsx` de 819 líneas) -
solo `TransResumeChart.tsx` necesitó 1 ronda de rework, por el hallazgo
descrito arriba.

## 2026-09-29 — Historia 12 (Budgets analytics) completa: 7/7 archivos

La sección "Budgets comparative" de `/dashboard/history` completa:
`budgetTypes.ts` [21→39 líneas, clasificación spending/saving/project,
ya usado por 6 consumidores TS existentes que siguieron compilando sin
cambios], `budgetHistoricalComparative.ts` [108→208 líneas, el
transformer principal - `walletAnalyzer.ts` (Historia 9) ya lo
consumía con sus propios tipos locales sin que el compilador pudiera
verificar nada, siendo la función implícitamente `any`; esta migración
fue la primera vez que ese cruce se validó de verdad, y pasó limpio;
con su test suite corrida aparte, 9/9], `propsForBudgetMonthlyChart.tsx`
[100→172 líneas - correctamente migrado a `.tsx` en vez de `.ts`
porque el `.js` original ya tenía JSX real en su callback de tooltip],
`BudgetHistoricalComparativeRow.tsx`, `BudgetHistoricalDetailModal.tsx`,
`HistoricalBudgetsComparativeView.tsx`, y `HistoricalBudgetsComparative.tsx`
[entry, el bridge ya existente en `HistoryClient.tsx` desde Historia 10
siguió compilando sin tocarlo].

Historia puramente de UI/lógica de cliente - la ruta `budget/get-historical`
ya estaba migrada desde Historia 7, así que **sin fixes de seguridad
nuevos**. **Cero rondas de rework en toda la historia** - la segunda
historia más limpia después de Historia 9, y sin ninguna recurrencia
del patrón dispatch-less-Redux por primera vez desde que empezó a
aparecer en Historia 6.

**Bugs no-seguridad encontrados y preservados sin arreglar** (ver tabla
de bugs pendientes, filas 29-35): `getBudgetType()` sin rama explícita
para `budgetType === "saving"`; fecha inválida silenciosa en
`getEarliestKnownGoal()` cuando falta `effectiveFrom`; `estimated: false`
incorrecto en `resolveMonthlyGoalAmount()` para budgets sin `history`
ni `createdAt`; sort de compliance sin criterio de desempate; falta
`e.preventDefault()` en la navegación por teclado de una fila (permite
scroll de página al abrir el modal); `complianceRate === null` se
muestra igual que "0% compliance" real; y un crash potencial de
`formatMoneyMajor` si la moneda no está definida/soportada, sin
fallback interno en ese componente.

Los 7 archivos limpios a la primera revisión, ninguno necesitó rework.

## 2026-09-29 — Historia 13 (Navbar/alta rápida) completa: 5/5 archivos

El shell de navegación completo y el modal de alta rápida:
`scrollLock.ts` [31 líneas, helper de bloqueo de scroll compartido],
`ThemeProvider.tsx` [75→86 líneas, contexto claro/oscuro],
`TransferExchangeModal.tsx` [268→292 líneas, el archivo más sensible -
formulario real de transferencia/conversión de divisas entre cuentas],
`AddTransactionModal.tsx` [100→106 líneas, modal de 4 tabs], y
`Navbar.tsx` [205→212 líneas, entry, renderizado desde
`dashboard/layout.tsx`]. Todas las rutas de API que este árbol
necesita ya estaban migradas desde Historias 7-9 - historia puramente
de UI/lógica de cliente, **sin fixes de seguridad nuevos**.

**1 ronda de rework, la segunda vez en toda la migración que un guard
no forzado casi tapa un crash real** (después del caso de
`TransResumeChart.tsx` en Historia 11) - y esta vez en el archivo más
delicado posible, el submit de una transferencia de dinero real:
- `MobileDateTimePicker.onChange` llamaba `newValue.format()` directo
  en el original (crash si el usuario limpia el campo). La migración
  agregó `if (newValue) {...}` - no requerido por el compilador
  (verificado quitándolo, `tsc --noEmit` sigue limpio con `strict:
  false`), revertido para preservar el crash original.
- El payload de `handleSubmit` mandaba `user: user._id, wallet:
  user.wallet` directo en el original (crash si `user` fuera
  null/undefined). La migración agregó `?.` sobre el cast - tampoco
  requerido por el compilador, revertido a `(user as UserData)._id`/
  `.wallet` sin `?.` para preservar el crash original exacto.

**Bugs no-seguridad encontrados y preservados sin arreglar** (ver tabla
de bugs pendientes, filas 36-41): los 2 crashes preexistentes ya
descritos arriba; `EMPTY_FORM.date` congelado a nivel de módulo (mismo
patrón que `today`/`year` de Historias 10-11); el flag
`destinationTouched` "pegajoso" que desactiva permanentemente el
autocompletado de cotización de divisa tras la primera edición manual;
redondeo sub-centavo (`Math.round` en `majorToMinor`) que bloquea el
submit con "Enter both amounts" aunque el usuario sí haya escrito un
monto; y una 3ra ocurrencia de `ccUser.status` siempre `undefined` en
`Navbar.tsx` (mismo patrón raíz que el bug #13 de `ReadFileComp.tsx`,
Historia 8 - `useSelector` lee `.data` en vez del slice completo con
`.status`).

4 de los 5 archivos limpios a la primera revisión - solo
`TransferExchangeModal.tsx` necesitó 1 ronda de rework, por ser
justamente el archivo con lógica de dinero real donde más importaba
revisar dos veces cada `?.` nuevo.
