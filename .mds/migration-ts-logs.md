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
