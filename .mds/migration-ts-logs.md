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
| 37 | `general-data/projections/update` (POST) | Cero verificación de sesión - confiaba en el `mail` del body para actualizar los projection settings (buffers mensuales, balance manual) de cualquier usuario. | `17b1e9a` | Alta |
| 38 | `general-data/projection-baseline/update` (POST) | Cero verificación de sesión - confiaba en el `mail` del body para crear/editar entradas del historial de ingreso/gasto (baseline) de cualquier usuario. | `3971553` | Alta |
| 39 | `general-data/projection-baseline/delete` (POST) | Cero verificación de sesión - confiaba en el `mail` del body para borrar entradas del historial de ingreso/gasto (baseline) de cualquier usuario. | `b26a2d2` | Alta |
| 40 | `general-data/income-sources/update` (POST) | Cero verificación de sesión NI de ownership - `IncomeSource.findById(id)` a secas permitía a cualquiera (autenticado o no) modificar amount/recurrence/currency/anchorDate/active de la income source de cualquier usuario conociendo/adivinando el ObjectId. Mismo nivel de gravedad que el bug de `remove-many` (fila 28). | `55300de` | Crítica |
| 41 | `general-data/income-sources/new` (POST) | Cero verificación de sesión - el `user`/`wallet` del body se pasaban tal cual al crear la income source, permitiendo forjar income sources atribuidas a cualquier usuario/wallet. Mismo patrón que el fix #27 (`new-transaction`). | `231d055` | Crítica |
| 42 | `general-data/income-sources/remove` (POST) | Cero verificación de sesión NI de ownership - `IncomeSource.findById(id)` a secas permitía archivar (soft-delete) la income source de cualquier usuario conociendo/adivinando el ObjectId. Mismo patrón que el fix #40. | `8241872` | Crítica |
| 43 | `general-data/user/remove-user (POST)` | Cero verificación de sesión - `User.findOneAndDelete({mail})` con el mail del body borraba a cualquier usuario y TODOS sus datos (wallet, cuentas, transacciones, categorías, subcategorías, tags y colecciones de Better Auth). Junto con remove-many (#28) y las de income-sources, la más destructiva de la migración. | `ebb06d5` | Crítica |
| 44 | `general-data/tags/new (POST)` | Cero verificación de sesión - user/wallet del body se guardaban tal cual: se podían forjar tags en cualquier usuario/wallet. | `c571d48` | Alta |
| 45 | `general-data/tags/remove (POST)` | Cero verificación de sesión NI ownership - `Tag.findByIdAndDelete(id)` a secas. | `7c85fa2` | Alta |
| 46 | `general-data/tags/update (POST)` | Cero verificación de sesión NI ownership - `Tag.findById(id)` a secas permitía editar tags ajenos. | `f617970` | Alta |
| 47 | `general-data/category-rules/apply-suggestions (POST)` | Cero sesión; `Transaction.findById` a secas permitía recategorizar transacciones ajenas y los category/subCategory del cliente se asignaban sin verificar dueño. | `772280b` | Crítica |
| 48 | `general-data/category-rules/suggest (POST)` | Cero sesión; confiaba en el mail del body: exponía transacciones sin categorizar y reglas de cualquier usuario. | `3c9d20e` | Alta |
| 49 | `general-data/[id] (GET)` | Cero sesión; `params.id` (un mail) devolvía el volcado completo (user, wallet, cuentas, budgets, transacciones, categorías, tags) de cualquier cuenta. | `20ed990` | Crítica |
| 50 | `general-data (POST)` | Cero sesión; el mail llegaba como body crudo y devolvía el volcado completo de cualquier cuenta (misma clase que get-all, #25). | `0570f20` | Crítica |
| 51 | `general-data/files/upload/[id] (POST)` | Cero sesión; mail en la URL: se podían inyectar transacciones en la cuenta de cualquier usuario subiendo un Excel. | `b3e17f9` | Crítica |
| 52 | `general-data/files/deduplicate/[id] (POST)` | Cero sesión; mail en la URL y `Transaction.deleteMany({_id:{$in}})` sin scope: permitía borrar transacciones de otro usuario. | `4f0d32d` | Crítica |
| 53 | `general-data/files/export/[email] (POST)` | Cero sesión; mail en la URL: exportaba a Excel las transacciones de cualquier usuario dados sus ids. | `37cd4bf` | Alta |
| 54 | `general-data/files/template/[email] (GET)` | Cero sesión; mail en la URL: descargaba las cuentas, categorías y subcategorías personalizadas de cualquier usuario. | `e85c2a0` | Media |

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
| 42 | `income-sources/update/route.ts` | `!amount ? updateIncomeSource.amount : amount` hace imposible fijar el monto de una income source a exactamente `0` (siempre se lee como "no vino este campo" y se conserva el valor viejo). | Historia 14 |
| 43 | `income-sources/update/route.ts` | Por el mismo motivo del bug #42, `isChanging` (`!!amount && amount !== ...`) nunca detecta un cambio a monto `0`, así que ese cambio tampoco queda registrado en el historial de versiones. | Historia 14 |
| 44 | `income-sources/update/route.ts` | La respuesta incluye `status: 201` en el cuerpo JSON, pero `NextResponse.json(...)` sin opciones explícitas siempre responde con status HTTP 200 real - el 201 del body es puramente informativo y no coincide con el código HTTP real. | Historia 14 |
| 45 | `income-sources/new/route.ts` | `if (!newIncomeSource)`/`if (!savedIncomeSource)` son código muerto - Mongoose nunca hace que el constructor `new IncomeSource(...)` ni `.save()` regresen un valor falsy en el flujo normal (fallarían lanzando una excepción, no regresando `null`/`undefined`). | Historia 14 |
| 46 | `income-sources/new/route.ts` | Si no se manda `name`, el mensaje de éxito interpola a `"null was created successfully 🤓"` en vez de un nombre por default legible. | Historia 14 |
| 47 | `income-sources/new/route.ts` | La entrada inicial de `history` solo guarda `amount` en unidades mayores, sin inicializar el subdocumento de dinero multi-moneda (`money`/`amountMinor`+`currency`) que sí usan otras partes del modelo - inconsistente con el resto del esquema multi-currency. | Historia 14 |
| 48 | `income-sources/remove/route.ts` | La respuesta de una operación de archivado/borrado usa `status: 201` en vez de 200/204. | Historia 14 |
| 49 | `income-sources/remove/route.ts` | Typo en el mensaje de error: "No ID was provided to **removed** the income source" (debería ser "remove"). | Historia 14 |
| 50 | `income-sources/remove/route.ts` | Si hubiera múltiples entradas sin `effectiveTo` en `history` por alguna inconsistencia previa de datos, `.find()` solo cierra la primera, dejando las demás "abiertas" indefinidamente. | Historia 14 |
| 51 | `ProjectionVarianceCell.tsx` | Usa `usdFormatChanger` (formato fijo `en-US`/USD) en vez de considerar la moneda primaria real de la wallet del usuario. | Historia 14 |
| 52 | `ProjectionVarianceCell.tsx` | Cuando `value === 0`, tanto con `betterWhenPositive: true` como `false`/`undefined`, `0 >= 0` y `0 <= 0` evalúan ambos a `true` - siempre produce "mejor de lo esperado" incluso cuando en realidad no hubo variación. | Historia 14 |
| 53 | `ProjectionAccuracyInfoModal.tsx` | Botón de cierre es un `<div onClick={onClose}>` sin `aria-label`, `role="button"` ni soporte de teclado - no accesible. | Historia 14 |
| 54 | `ProjectionsInfoModal.tsx` | Mismo patrón que el bug #53 (botón de cerrar es `<div>` no semántico), ocurrencia en archivo distinto. | Historia 14 |
| 55 | `ProjectionsInfoModal.tsx` | Inconsistencia de `z-index`: el contenedor interno usa `z-[1001]` mientras `BasicModal` maneja `z-[5000]`. | Historia 14 |
| 56 | `ProjectionsInfoModal.tsx` | Typo gramatical menor en el título: "How Projections works" (debería ser "work"). | Historia 14 |
| 57 | `ProjectionAccuracyReport.tsx` | Mismo patrón que los bugs #53/#54 (trigger del modal de ayuda es un `<div>` no accesible), ocurrencia en archivo distinto. | Historia 14 |
| 58 | `ProjectionAccuracyReport.tsx` | Cada `<tr onClick={() => onRowClick(row.monthName)}>` actúa como botón interactivo pero sin `role="button"`, `tabIndex` ni `onKeyDown` - no operable por teclado. | Historia 14 |
| 59 | `ProjectionAccuracyReport.tsx` | Mismo patrón que el bug #51 (`usdFormatChanger` con formato fijo USD), ocurrencia en archivo distinto. | Historia 14 |
| 60 | `ProjectionAccuracyReport.tsx` | Campos numéricos opcionales de `row` (`actualIncome`, `projectedIncome`, etc.) se pasan sin coalescing a `usdFormatChanger`/`ProjectionVarianceCell` - pueden producir `NaN` si son `undefined`. | Historia 14 |
| 61 | `CurrencyBreakdownChips.tsx` | Si `breakdown.isMultiCurrency` es `true` pero la propiedad interna `breakdown.breakdown` es `undefined`/`null`, `.map()` lanza un `TypeError` real en runtime - no se agregó `?.` defensivo por regla de oro. | Historia 14 |
| 62 | `CurrencyBreakdownChips.tsx` | Si `g.currency !== walletPrimaryCurrency` y `walletPrimaryCurrency` es `undefined`, `formatMoneyMinor` lanza error de "moneda no soportada" al convertir. | Historia 14 |
| 63 | `CurrencyBreakdownChips.tsx` | Si `g.effectiveDate` no es parseable por `Date`, el tooltip muestra literalmente "Invalid Date". | Historia 14 |
| 64 | `ProjectionMonthDetailModal.tsx` | En `handleSaveBalance`, si `manualBalance` no existe el estado inicial es `""`; `Number("")` evalúa a `0`, así que guardar sin ingresar valor registra un balance de `$0` en vez de `null`/cancelar. | Historia 14 |
| 65 | `ProjectionMonthDetailModal.tsx` | Si algún elemento de `bufferRevisions` no tiene `updatedAt` válido, `+new Date(undefined)` da `NaN`, produciendo un orden inestable en el sort. | Historia 14 |
| 66 | `ProjectionMonthDetailModal.tsx` | `{row.occurrences * row.amount}` en la lista de ingresos esperados asume ambos campos numéricos válidos - si alguno fuera `undefined`, el resultado es `NaN`. | Historia 14 |
| 67 | `HistoricalBaselinePanel.tsx` | `onChange()` se invoca directo en `handleSubmit`/`handleRemove` sin verificar si la prop fue provista. | Historia 14 |
| 68 | `HistoricalBaselinePanel.tsx` | `minorToMajor` lanza `Error: Unsupported currency: ...` si `entry[moneyField]?.currency` no está en `SUPPORTED_CURRENCIES`, sin manejo específico. | Historia 14 |
| 69 | `HistoricalBaselinePanel.tsx` | Si `amount` está vacío (`""`) en el submit, `Number(amount \|\| 0)` evalúa a `0`, creando/actualizando una entrada con valor 0 en vez de validar. | Historia 14 |
| 70 | `HistoricalBaselinePanel.tsx` | `formatMonthYear` con fecha nula/indefinida produce `"Fecha no válida"`/`"Invalid Date"` en vez de manejarlo explícitamente. | Historia 14 |
| 71 | `IncomeSourcesPanel.tsx` | `handleDateChange` llama `newValue.format()` sin proteger contra `null` - crash real si el usuario limpia el campo de fecha. Preservado deliberadamente (instrucción explícita a agy de NO agregar guard). | Historia 14 |
| 72 | `IncomeSourcesPanel.tsx` | `onChange()` se invoca directo en `handleSubmit`/`handleRemove` sin verificar si la prop fue provista - mismo patrón que el bug #67. | Historia 14 |
| 73 | `IncomeSourcesPanel.tsx` | `form.currency` se inicializa una sola vez vía `useState(() => getEmptyForm(defaultCurrency))` - si `walletPrimaryCurrency` cambia después del montaje, el formulario no se resincroniza. | Historia 14 |
| 74 | `IncomeSourcesPanel.tsx` | En `startEdit`, `source.amount || ""` convierte un monto real de `0` a cadena vacía (valor falsy). | Historia 14 |
| 75 | `IncomeSourcesPanel.tsx` | En el submit, `Number(form.amount)` convierte una cadena vacía `""` a `0` sin validar que el usuario haya escrito un monto real. | Historia 14 |
| 76 | `IncomeSourcesPanel.tsx` | `RECURRENCE_LABELS[source.recurrence]` puede evaluar a `undefined` si la recurrencia es personalizada o está ausente, sin fallback textual. | Historia 14 |
| 77 | `projection-baseline/update/route.ts` | `new Date(effectiveTo)` se usa directo sin sanear cadenas no parseables, pudiendo guardar una fecha inválida en el historial de baseline. | Historia 14 |
| 78 | `apiTokens.ts` | `authHeader.split(" ")` en `getUserFromApiToken` falla si el header `Authorization` tiene más de un espacio consecutivo (ej. `"Bearer  token"`), resolviendo el token a `""` y arrojando "Missing or malformed Authorization header". | Historia 15 |
| 79 | `apiTokens.ts` | `resolveApiToken` asume que `user.apiTokens.find(...)` siempre regresa un elemento tras el `findOne` previo - una condición de carrera externa que modifique el array en memoria lanzaría un `TypeError` real al asignar `lastUsedAt`. | Historia 15 |
| 80 | `currencies.ts` | `majorToMinor` puede retornar `-0` en vez de `0` cuando `Math.sign(-0) * Math.round(0)` (`Object.is(-0, 0)` es `false`). | Historia 15 |
| 81 | `currencies.ts` | `formatMoneyMajor` crea una nueva instancia de `Intl.NumberFormat` en cada invocación en vez de memoizarla. | Historia 15 |
| 82 | `currencies.ts` | `amount ?? 0` en `formatMoneyMajor` no protege contra `NaN` (nullish coalescing solo atrapa `null`/`undefined`) - si se pasa `NaN`, formatea literalmente como `"NaN"`/`"$NaN"`. | Historia 15 |
| 83 | `currencies.ts` | `assertSupportedCurrency` se invoca de forma redundante hasta 3 veces en la cadena `formatMoneyMinor` → `minorToMajor` → `getMinorUnits`, y otra vez en `formatMoneyMajor`. | Historia 15 |
| 84 | `transactionReadService.ts` | En `attachDisplayMoney`, cuando `reporting.currency === walletPrimaryCurrency`, el flag `stale` se fija estáticamente en `false`, sin considerar si el snapshot original ya era stale. | Historia 15 |
| 85 | `transactionReadService.ts` | `attachDisplayMoneyToList` corre todas las conversiones vía `Promise.all` sin límite de concurrencia - si una sola falla, rechaza la lista completa. | Historia 15 |
| 86 | `createTransaction.ts` | Si `tags` se pasa como string en vez de array (permitido por `new-transaction/route.ts`), el `for...of` itera carácter por carácter, creando un tag por letra. | Historia 15 |
| 87 | `createTransaction.ts` | `if (!newTag) throw ...` y `if (!savedTransacction) throw ...` son código muerto - Mongoose nunca regresa falsy ahí (el constructor/`.save()` fallarían lanzando, no regresando `null`/`undefined`). | Historia 15 |
| 88 | `createTransaction.ts` | `if (!amount) throw ...` rechaza montos de exactamente `0` al ser un valor falsy. | Historia 15 |
| 89 | `createTransaction.ts` | `if (!isReadable) isReadable = true;` imposibilita persistir una transacción con `isReadable: false` explícito. | Historia 15 |
| 90 | `createTransaction.ts` | Typos preexistentes: mensajes con "finded" en vez de "found", y variables `newTransacction`/`savedTransacction` con doble "c". | Historia 15 |
| 91 | `mcpProjections.ts` | En rangos que cruzan año, el segundo año del loop en `buildProjectionsForRange` recibe el mismo `startingBalance` estático de las cuentas en vez de encadenar el balance proyectado al cierre del año anterior. | Historia 15 |
| 92 | `transactionsChange.ts` | `orderByHighestValue`, `sortBasedOnValueProperty` y `sortByIndex` usan `Array.prototype.sort` sobre el array recibido (mutan la entrada). Con un array congelado de Redux lanzarían `Cannot assign to read only property`. | Historia 16 |
| 93 | `transactionsChange.ts` | `orderByHighestValue` ordena por `(b.value || b.amount)`: un `value` de exactamente `0` se trata como ausente y cae a `amount`, mezclando dos campos como llave de orden. | Historia 16 |
| 94 | `transactionsChange.ts` | `reduceAndTransforToCategories` agrupa por `category.name`, no por id: dos categorías distintas con el mismo nombre se fusionan en una sola fila. | Historia 16 |
| 95 | `transactionsChange.ts` | `buildCategoryHierarchy` lee `t.category._id` sin `?.` para transacciones con subCategory: si tienen subCategory pero no category, lanza `TypeError` (mismo patrón raíz que el bug #24 de `TransResumeChart.tsx`, ahora en el helper compartido). | Historia 16 |
| 96 | `transactionsChange.ts` | `reduceTransToTransMonths` y `transformTransactionsToMonthsChartObject` bucketean por nombre de mes sin año. La segunda además usa siempre los rangos del año en curso (`new Date()`), devuelve `null` para fechas de otros años e ignora el fallback a `createdAt` que sí usan las demás. | Historia 16 |
| 97 | `transactionsChange.ts` | `reduceTransToTransMonths` hace `mapedMonths.get(...).name` sin guard: una fecha inválida produce `getMonth()` NaN y lanza `TypeError`. | Historia 16 |
| 98 | `transactionsChange.ts` | `reduceTransactionsToMonthSpentObjects` comprueba `transaction && acc[transaction?.type]` pero en la rama else lee `transaction.type` sin guard (crash si `transaction` es null). | Historia 16 |
| 99 | `transactionsChange.ts` | `filterBillsOrIncomes` clasifica como ingreso todo lo que no es `isBill` ni transfer/exchange, incluyendo kinds `refund` y `fee`. | Historia 16 |
| 100 | `transactionsChange.ts` | `reduceTransCategoriesSliced` recibe un parámetro `slice` que nunca usa (se conserva con un eslint-disable). | Historia 16 |
| 101 | `transactionsChange.ts` | `usdFormatChanger` fija formato en-US/USD sin considerar la moneda primaria de la wallet. Es el origen de los bugs #51 y #59 (Historia 14); lo importan varios componentes ya migrados. | Historia 16 |
| 102 | `projectionsChange.ts` | `getBudgetActualSpend` suma el `amount` legacy en vez de `getPrimaryAmount`: ignora la conversión multi-moneda que sí aplican las demás funciones del archivo. | Historia 16 |
| 103 | `projectionsChange.ts` | `getBudgetActualSpend` no excluye fechas inválidas (`NaN < start` y `NaN > end` son ambos false, así que pasan el filtro), al contrario que `getTransactionsFromTimeRange`, que sí las descarta. | Historia 16 |
| 104 | `projectionsChange.ts` | `sumPerBucketMax` y `getMonthBucketBreakdown`: una factura que calza con varios budgets se cuenta completa en cada uno (solo se deduplica para el bucket "unexpected"). | Historia 16 |
| 105 | `projectionsChange.ts` | Los goalAmount de los budgets y los montos de baseline se asumen ya en la moneda primaria: `budget.currency` nunca se convierte en el cálculo de proyecciones. | Historia 16 |
| 106 | `projectionsChange.ts` | `sumBaselineEntriesAtDate` cae a `"MXN"` cuando a una entrada le falta `currency`, en lugar de la moneda primaria de la wallet (con una wallet en JPY usaría los decimales equivocados). | Historia 16 |
| 107 | `projectionsChange.ts` | `getBudgetPeriodRange` trata cualquier `period` desconocido como yearly, y en `monthly` ignora `referenceDate` si se pasan fallbackStart/End. | Historia 16 |
| 108 | `projectionsChange.ts` | `getExpectedOccurrencesInMonth` asume 2 (biweekly) o 4 (weekly) ocurrencias fijas cuando falta `anchorDate`; `countIntervalOccurrences` suma milisegundos fijos, así que el cambio de horario (DST) puede correr una ocurrencia un día. | Historia 16 |
| 109 | `projectionsChange.ts` | `getMonthCurrencyBreakdown` omite en silencio las transacciones sin `displayMoney` (subcuenta el desglose) y la tasa mostrada por moneda es la de una sola transacción (la de fecha más reciente), no un promedio. | Historia 16 |
| 110 | `transactionDuplicates.ts` | `areDuplicates` compara `String(a.date || a.createdAt).slice(0, 10)`: si `date` es una instancia `Date` (no string ISO), el slice toma el inicio de `"Wed Aug 20 …"` y no una fecha. | Historia 16 |
| 111 | `transactionDuplicates.ts` | `areDuplicates`: con el criterio de fecha activo y `dateTol` undefined, `diffDays > undefined` es false, así que nunca descalifica por fecha. | Historia 16 |
| 112 | `transactionDuplicates.ts` | `nativeAmountMinor`: si `displayMoney.native` existe pero su `amountMinor` es undefined, devuelve undefined en vez de caer al cálculo legacy con `amount`. | Historia 16 |
| 113 | `budgetCoverage.ts` | `getBudgetCoverage` compara `date >= startDate` directo: si startDate/endDate llegan como string, Date se convierte a número y el string a NaN, así que la comparación es siempre false y el rango no filtra lo que debería. | Historia 16 |
| 114 | `budgetCoverage.ts` | `getBudgetCoverage`: un movimiento con `explicitBudgetId` cuyo budget no está activo (p. ej. archivado) queda `uncovered` sin evaluar los budgets de categoría. | Historia 16 |
| 115 | `categoryRuleMatcher.ts` | `passesAmountThreshold`: si `nativeMoney` existe pero `amountMinor` es null/undefined, las comparaciones (null→0, undefined→NaN) hacen que la regla pase los umbrales sin validar el monto. | Historia 16 |
| 116 | `categoriesTransformers.ts` | Typo preexistente en el mensaje de error: `"the element shoudl be a instance of Array"`. | Historia 16 |
| 117 | `categoriesTransformers.ts` | `organizedCategoriesAndSubCategories`: raíces sin `_id` ni `name` colisionan en la clave `"undefined"` y se sobrescriben. | Historia 16 |
| 118 | `categoriesTransformers.ts` | `organizedCategoriesAndSubCategories`: una subcategoría cuyo `fatherCategory` es un string ID que no existe en el mapa se descarta en silencio (la rama else solo procesa objetos con `name`). | Historia 16 |
| 119 | `categoriesTransformers.ts` | `sortItemsByName` muta en el lugar el array devuelto por `Object.values(categoryMap)`. | Historia 16 |
| 120 | `user/remove-user/route.ts` | El mensaje de éxito usa `removedUser.name`, pero el modelo User guarda `fullName`: responde "undefined removed successfully 🤓". | Historia 17 |
| 121 | `user/remove-user/route.ts` | El borrado en cascada no es atómico (sin transacción): si falla a mitad, quedan datos parcialmente borrados; y los `if(!x) throw` tras `deleteMany` son código muerto porque nunca devuelve falsy. Además no exige step-up 2FA (`markStepUpVerified`) para una operación destructiva. | Historia 17 |
| 122 | `tags/remove/route.ts, tags/update/route.ts` | El mensaje de error "No request received from NEW TAG" está copiado de tags/new en las tres rutas. | Historia 17 |
| 123 | `tags/update/route.ts` | `!color ? updatedTag.color : color` (y lo mismo con name) impide vaciar el color o el nombre de un tag. | Historia 17 |
| 124 | `wallet/route.ts` | `!cash`, `!totalBudget`, `!isSurpassed`, etc. impiden poner un valor en 0 o false; los mensajes de error dicen "REMOVE-ACCOUNT" (copiados de otra ruta). | Historia 17 |
| 125 | `category-rules/apply-suggestions/route.ts` | No valida que category y subCategory sean coherentes entre sí (padre-hijo), y un id inválido en medio del lote aborta la petición con las transacciones anteriores ya guardadas (sin transacción de BD). | Historia 17 |
| 126 | `general-data/[id]/route.ts` | `if (!params) Error(...)` sin `throw`; los mensajes dicen "GENERAL-DATA POST" en un GET; responde `status: 201` en un GET; encadena `.lean().populate()` sobre Wallet. | Historia 17 |
| 127 | `general-data/route.ts, general-data/[id]/route.ts` | HALLAZGO DE SEGURIDAD PENDIENTE DE DECISIÓN: `data.user` incluye `password` (hash) y `apiTokens` (con `tokenHash`) del documento User, y `[id]` hace `console.log(userFound)` volcando ese documento a los logs del servidor. Hoy solo lo ve el dueño de la cuenta y ninguna pantalla llama a estas rutas (solo código comentado), así que se dejó sin tocar; convendría quitar esos campos o borrar las rutas. | Historia 17 |
| 128 | `general-data/route.ts` | `status: 201` en GET y POST, typos "Data founded"/"Wallet no found", y el `console.log(dataRequest)` original se conserva. | Historia 17 |
| 129 | `files/deduplicate/[id]/route.ts` | La ventana de duplicados es de ±30 horas y las filas sin concepto se omiten en silencio. | Historia 17 |
| 130 | `files/upload/[id]/route.ts` | Si la subcategoría tiene categoría padre, esa gana sobre la categoría de la columna del Excel; las fechas se parsean con zona horaria local. | Historia 17 |
| 131 | `files/template/[email]/route.ts` | Las validaciones de datos del Excel están hardcodeadas a las filas 3-202 y la fila de ejemplo lleva `new Date()` en el momento de descarga. | Historia 17 |
| 132 | `files/export/[email]/route.ts` | El estilo de la fila de nota es estático y la fecha cae a `createdAt` solo si `date` es falsy. | Historia 17 |
| 133 | `fetcher.ts` | `baseUrl.concat(apiRoute)` sin guard: si `NEXT_PUBLIC_API_ROUTE` no está definida lanza `TypeError` al crear el fetcher; `post` hace `console.log(e)` de cada error antes de relanzarlo. | Historia 18 |
| 134 | `gastifyNotifier.ts` | Los toasts `error`, `info` y `warning` llevan un espacio inicial en el mensaje (`` ` ${nMessage}` ``) y el de `ok` no. | Historia 18 |
| 135 | `defaultIconsDB.ts` | Nombres de categoría de íconos con typos preexistentes (p. ej. "EASHTETIC"). | Historia 18 |
| 136 | `orderFunctions.ts` | Mensaje de error con typo: "the arr shoudl be a instance of Array". | Historia 18 |
| 137 | `Wallet.ts` | El schema declara `user: { require: true }` (typo de `required`): Mongoose lo ignora, así que un Wallet sin `user` se guarda igual (mismo typo que en otros modelos). | Historia 18 |
| 138 | `TransactionItemList.tsx, AtomicTop.tsx, TopCategoryRow.tsx, ModalContentTopMonthItem.tsx` | Mandan `size={...}` (o `siz` mal escrito) a `UniversalCategoIcon`/`CategoIcon`, que leen `siz`: el tamaño nunca se aplica. Misma raíz que el bug #8, ocurrencias nuevas; se preservó con wrappers tipados. | Historia 19 |
| 139 | `BasicTooltip.tsx` | Typo en la propiedad de estilo `style?.iconZise`. | Historia 19 |
| 140 | `TooltipForChart.tsx` | El porcentaje se recorta con `String(...).slice(0, 4)` en vez de redondearse. | Historia 19 |
| 141 | `TopElementContainerView.tsx, HistoricalMovementsView.tsx, TopElementsContainer.tsx, HistoricalMovementsController.tsx` | Los controllers pasan la prop `isloading` (minúscula) pero las vistas leen `isLoading`, que llega `undefined`: la comparación `isLoading <= 0` es falsa y el skeleton de carga nunca se muestra. | Historia 19 |
| 142 | `TopElementContainerView.tsx` | Clase Tailwind `5xl` sin el prefijo `text-` en el `<h1>` y typo en el tooltip ("Filter de date by generic filter"). | Historia 19 |
| 143 | `TopElementsContainer.tsx, HistoricalMovementsController.tsx` | `setUser(ccUser.data)` y `setTransacctions(ccTransacciones.data)` se llaman sin `dispatch(...)` en el `useEffect`: nunca actualizan el store (7ma y 8va ocurrencia del patrón de los bugs #15, #16, #27, #28). | Historia 19 |
| 144 | `BudgetCont.tsx` | La condición usa el operador bitwise `&` en vez de `&&` (`bcTrans.length > 0 & bcBudget.length > 0`); funciona por coerción a 0/1 pero es un error de tipeo. Además una reasignación descarta el filtro `isReadable` aplicado justo antes. | Historia 20 |
| 145 | `CreditCard.tsx` | Typos en las opciones del selector de rango: "Las week" y "Las 15 days" (deberían decir "Last"). | Historia 20 |
| 146 | `TabsTrans.tsx` | Símbolo `$` fijo en el tooltip (`${String(visibleTotal).slice(0, 9)}`), división por cero (NaN%) cuando `visibleTotal` es 0 y la prop `ttHorizontal` se recibe pero nunca se lee. | Historia 20 |
| 147 | `ColumnChartAntComparative.tsx` | Typo de configuración `offsed: 0` (en vez de `offset`, así que se ignora) y posible NaN% en la etiqueta si `totalValue` no es numérico. | Historia 20 |
| 148 | `ResponsiveBarsChartComponent.tsx` | Typo de prop `legenedLeft` y el tooltip lee `dataa.data.type` sin guard (error si es undefined). | Historia 20 |
| 149 | `UnbudgetedSpending.tsx, CreditCard.tsx, BudgetCont.tsx, TabsTrans.tsx, ResumeTabsTrans.tsx, CategoryCircle.tsx, SelectCategoryBtn.tsx, ResponsiveBarsChartComponent.tsx` | Siguen mandando `siz`/`size` mal escrito a `CategoIcon`/`UniversalCategoIcon` (el tamaño no se aplica). Misma raíz que el bug #8; ocurrencias nuevas, preservadas. | Historia 20 |
| 150 | `page.tsx` | Usa la etiqueta `<navbar>`, que no existe en HTML (debería ser `<nav>`); se preservó en el DOM con un cast. | Historia 21 |
| 151 | `page.tsx` | Las etiquetas `<img>` no tienen atributo `alt` (accesibilidad) y usan `srcSet` con un único asset. | Historia 21 |
| 152 | `page.tsx` | Typo en el texto de la landing: "Excel or XLM files" (más abajo dice XML). | Historia 21 |
| 153 | `page.tsx` | Copyright fijo "© 2014 Gastify". | Historia 21 |
| 154 | `timeFunctions.ts (`generate_timeperiod_ranges_array_for_dashboard`) + SelecterFilter, Dashboard y Movements` | REPORTADO POR EL USUARIO PROBANDO LA UI (2026-09-30). En el dropdown de periodo del dashboard, "Last 3 months" cambia los datos pero el dropdown no queda seleccionado en esa opción; "Last Month", "First half of month" y "Second half of month" sí funcionan. CAUSA (confirmada leyendo el código): el `value` de "Last 3 months" incluye `${today}`, un `new Date()` con hora/minuto/segundo que se vuelve a generar en CADA render; el `<select>` guarda el value del render anterior, ya no coincide con ninguna opción del array nuevo y no puede mostrarla seleccionada (las otras opciones usan fechas a medianoche, estables todo el día). Se relaciona con los bugs #1, #17, #19 y #20. | Reportado en pruebas de UI |
| 155 | `Movements.tsx / Transaction Details (hipótesis sin confirmar)` | REPORTADO POR EL USUARIO PROBANDO LA UI (2026-09-30). Al crear una transacción y abrir Transaction Details, a veces no aparece hasta que se cambia el filtro de tiempo (pasó 2 veces; luego ya apareció normal). CAUSA PROBABLE, SIN CONFIRMAR: el filtro de Movements recorta por el rango de fechas del periodo (`getTransactionsFromTimeRange`), y si el fin de ese rango quedó congelado a la hora en que se cargó la página (como pasa con "Last 3 months" = `${today}` o con los `new Date()` de módulo de los bugs #17/#19), una transacción creada después tiene una fecha posterior al fin del rango y queda fuera hasta que el filtro se recalcula. Para confirmar: reproducir con el periodo por defecto y comparar la fecha de la transacción nueva contra el fin del rango; recargar la página debería hacer que aparezca. | Reportado en pruebas de UI |
| 156 | `files/deduplicate/[id]/route.ts` | Hace `.populate()` de `category`, `subCategory`, `account` y `tags` pero NO importa los modelos Category, SubCategory, Account ni Tag (y `Transaction.ts` tampoco los importa; solo los referencia por nombre con `ref`). Funciona mientras otro módulo del mismo proceso ya los haya registrado en Mongoose; en una función serverless en frío (cada ruta de Vercel es una función aparte) puede lanzar `MissingSchemaError: Schema hasn't been registered for model ...`. Mismo problema que ya se arregló en otras rutas con `import "@/model/Account"` de efecto secundario. Encontrado el 2026-10-01 al verificar si se podían borrar las rutas muertas; el código original ya era así. | Hallazgo en auditoría |

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

## 2026-09-29 — Historia 14 (Projections) completa: 16/16 archivos

La página `/dashboard/projections` completa de gestión, distinta de la
tabla de solo-lectura `HistoricalProjectionsTable.tsx` ya migrada en
Historia 10: `dashboard/projections/page.tsx` [entry de Next.js, 21→20
líneas, trivial], `ProjectionsClient.tsx` [221→239 líneas, entry de
cliente, cablea los 6 hijos ya migrados de esta misma historia],
`IncomeSourcesPanel.tsx` [256 líneas, CRUD de fuentes de ingreso],
`HistoricalBaselinePanel.tsx` [272 líneas, CRUD de baseline histórico
de ingreso/gasto], `ProjectionMonthDetailModal.tsx` [325→379 líneas, el
más grande, usa `Movements.tsx` ya migrado y `CurrencyBreakdownChips.tsx`],
`ProjectionAccuracyReport.tsx` [86 líneas], `ProjectionAccuracyInfoModal.tsx`
[80 líneas], `ProjectionsInfoModal.tsx` [74 líneas], `ProjectionVarianceCell.tsx`
[39 líneas], y `CurrencyBreakdownChips.tsx` [38 líneas, compartido, también
usado por `BudgetDetailModal.tsx`].

**6 fixes de seguridad nuevos (#37-42), las 6 rutas de escritura que
Historia 9 dejó explícitamente pendientes para esta historia** (ver
tabla consolidada arriba): `projections/update` y `projection-baseline/update`/
`delete` (el clásico "confiar en el `mail` del body" en vez de derivar
el usuario de la sesión), e `income-sources/update`/`new`/`remove` - estas
3 últimas la familia más grave encontrada en una sola historia hasta
ahora: `update` y `remove` no verificaban sesión NI ownership
(`IncomeSource.findById(id)` a secas, mismo nivel que el bug de
`remove-many` de Historia 8), y `new` forjaba la atribución de
`user`/`wallet` directo desde el body (mismo patrón que `new-transaction`
de Historia 8). Las 3 se corrigieron acotando por `wallet` del usuario
autenticado o derivando `user`/`wallet` de la sesión, sin cambiar
ningún comportamiento de los call sites reales.

**Cero rondas de rework en toda la historia** - ni siquiera en
`ProjectionsClient.tsx`, el archivo que finalmente cruzó y validó por
compilador las interfaces de los 6 hijos ya migrados (todas resultaron
compatibles sin ajustes). Sí hubo una investigación profunda de un
guard sospechoso en ese archivo - `(monthRanges.get(selectedRow.monthName)
|| {}) as MonthDateRange` - que se comprobó matemáticamente inerte
(`monthRanges` y `selectedRow.monthName` derivan de la misma función
`getYearMonthDateRange()` para el mismo año) y se aceptó sin cambios,
documentado en detalle en la revisión.

**36 bugs de comportamiento nuevos encontrados y preservados sin
arreglar** (ver tabla de bugs pendientes, filas 42-77) - el conteo más
alto encontrado en una sola historia hasta ahora, repartido en: 3
rutas de `income-sources` (imposibilidad de fijar monto a `0`,
`status: 201` que no coincide con el código HTTP real, mensajes con
typos o interpolación rota, entrada de `history` sin inicializar
subdocumento de dinero multi-moneda, `.find()` que solo cierra la
primera entrada abierta si hubiera varias); `ProjectionVarianceCell.tsx`
y `ProjectionAccuracyReport.tsx` (formato de moneda fijo a USD en vez
de la moneda primaria real de la wallet, la misma familia de bug de
`usdFormatChanger` vista en historias anteriores; evaluación de
"mejor de lo esperado" siempre verdadera cuando el valor es exactamente
`0`); 3 modales de ayuda (`ProjectionAccuracyInfoModal.tsx`,
`ProjectionsInfoModal.tsx`, `ProjectionAccuracyReport.tsx`) con el mismo
patrón de accesibilidad roto (`<div onClick>` en vez de `<button>`, filas
de tabla clickeables sin soporte de teclado); `CurrencyBreakdownChips.tsx`
(crash potencial de `.map()` si el breakdown interno es `undefined` pese
a `isMultiCurrency: true`, error de moneda no soportada si falta la
moneda primaria, "Invalid Date" en el tooltip); `ProjectionMonthDetailModal.tsx`
(guardar balance sin valor registra `$0` en vez de `null`, sort inestable
con fechas inválidas, `NaN` en el cálculo de ingresos esperados);
`HistoricalBaselinePanel.tsx` (4 bugs: `onChange()` sin guard, crash de
moneda no soportada, monto vacío tratado como `0`, fecha inválida sin
manejo); `IncomeSourcesPanel.tsx` (6 bugs: el crash de `handleDateChange`
preservado deliberadamente por instrucción explícita a agy de no
agregarle guard, `onChange()` sin guard, desincronización de moneda
post-montaje, `0` tratado como vacío, conversión ciega de monto, lookup
de recurrencia sin fallback); y `projection-baseline/update/route.ts`
(fecha `effectiveTo` sin sanear). El patrón `throw new Error(objeto)`
(bug #3, ya documentado) reapareció en las 3 rutas de `projections`/
`projection-baseline`.

Los 16 archivos limpios a la primera revisión salvo por las 6 rutas de
API donde se aplicaron los fixes de seguridad (esperado y deliberado,
no rework). Con esta historia el total de fixes de seguridad de toda
la migración llega a **42**, y el total de bugs de comportamiento
documentados en la tabla de pendientes llega a **77**.

## 2026-09-29 — Historia 15 (MCP tools) completa: 9/9 archivos

El servidor MCP remoto de Gastify que expone herramientas
(`create_transaction`, `get_monthly_summary`, `get_projections`, etc.)
a conectores de IA externos (Claude, ChatGPT) vía HTTP autenticado por
token personal: `apiTokens.ts` [54→95 líneas, `getUserFromApiToken`/
`resolveApiToken`], `currencies.ts` [88→131 líneas, helpers de dinero
compartidos por todo el proyecto], `transactionReadService.ts`
[66→142 líneas, DTO `displayMoney`], `fxRateService.ts` [135→196
líneas, cache-aside sobre snapshots ECB], `createTransaction.ts`
[184→227 líneas, función compartida de creación de transacciones],
`mcpProjections.ts` [120→170 líneas, proyecciones para la tool
`get_projections`], `buildGastifyMcpServer.ts` [703→763 líneas, el más
grande y sensible: las 12 MCP tools], y las 2 rutas de API que exponen
el servidor (`app/api/mcp/route.ts` [31→32 líneas, auth por header
Bearer] y `app/api/mcp/[token]/route.ts` [34→47 líneas, auth por token
en la URL]).

**Sin fixes de seguridad nuevos** - las 9 rutas/módulos de este árbol
ya estaban bien diseñados desde el original: cada tool handler deriva
`user`/`wallet` del closure ya autenticado por `resolveApiToken()`,
nunca de ids que vengan del cliente, y las 2 rutas de exposición
autentican cada request individualmente antes de delegar. Se investigó
un posible problema en `mcpProjections.ts` (`ProjectionSettings`/
`ProjectionBaseline` filtrando solo por `wallet`, sin `user`) y se
confirmó que NO es un IDOR real - `User.wallet` es un ObjectId único
(relación 1:1 usuario-wallet), así que filtrar por `wallet._id` ya
escopea correctamente sin ambigüedad.

**Cero rondas de rework en toda la historia**, incluyendo
`buildGastifyMcpServer.js` (703 líneas, el archivo más grande y
complejo de toda la migración hasta ahora) - cada cast/guard agregado
se verificó individualmente revirtiéndolo y recompilando antes de
aprobar, sin necesitar una sola vuelta con agy. Los dos transformers
compartidos más grandes de toda la app (`transactionsChange.js`,
`projectionsChange.js`) se consumieron como `any` implícito sin
inventar un typed bridge, siguiendo el mismo patrón ya establecido por
`useProjectionTable.ts` (Historia 10). `Wallet.js`, `transactionMoney.js`,
`transactionMoneyService.js`, `ecbClient.js` y `conversion.js`
(todos aún sin migrar) se dejaron como imports `.js` normales sin
typed bridge cuando ya había precedente de otros archivos migrados
consumiéndolos igual (`Transaction.ts`, `transfer/route.ts`).

**14 bugs de comportamiento nuevos encontrados y preservados sin
arreglar** (ver tabla de bugs pendientes, filas 78-91): en `apiTokens.ts`
(el `split(" ")` del header Authorization falla con espacios múltiples,
acceso a `apiTokens.find()` sin proteger una eventual condición de
carrera); en `currencies.ts` (4 bugs: `-0` en `majorToMinor`,
`Intl.NumberFormat` no memoizado, `NaN` no protegido en
`formatMoneyMajor`, validación redundante en cascada); en
`transactionReadService.ts` (`stale` fijo en `false` sin considerar el
snapshot original, `Promise.all` sin límite de concurrencia); en
`createTransaction.ts` (5 bugs, el más interesante nuevo: `tags` como
string en vez de array itera carácter por carácter creando un tag por
letra - además del código muerto en `!newTag`/`!savedTransacción`,
`amount: 0` rechazado, `isReadable: false` imposible de persistir, y
los typos ya conocidos); y en `mcpProjections.ts` (el balance inicial
no se encadena entre años en rangos multi-año).

Con esta historia el total de fixes de seguridad de toda la migración
se mantiene en **42** (sin nuevos), y el total de bugs de
comportamiento documentados en la tabla de pendientes llega a **91**.

## 2026-09-30 — Historia 16 (Transformers restantes) completa: 6/6 archivos

Los 6 helpers de `src/helpers/transformers/` que seguían en `.js`. Por pedido
explícito del usuario, **los 2 grandes los migró Claude directamente** (no
agy) y **los 4 chicos los migró agy y Claude los auditó**:
`transactionsChange.ts` [627→~790 líneas, 38 archivos lo consumían como `any`
implícito], `projectionsChange.ts` [508→~680 líneas], y los chicos
`transactionDuplicates.ts` [124], `budgetCoverage.ts` [135],
`categoryRuleMatcher.ts` [66] y `categoriesTransformers.ts` [50].

**Sin fixes de seguridad** (helpers puros, sin I/O ni acceso a datos ajenos).

**Lo nuevo de esta historia respecto a las anteriores:** por primera vez el
compilador validó de verdad las llamadas que hacían decenas de archivos ya
migrados a estos helpers (hasta ahora `any` implícito). Salieron ~30 errores
de consumidores, todos por tipos de consumidor demasiado laxos o demasiado
estrictos, ninguno por lógica: se resolvieron ajustando los tipos del helper
(genéricos `<T extends ...>`, `category`/`subCategory` como `unknown` porque
así los declaran `BudgetData`/`TransactionData`, buckets como `type` alias
para ser asignables a consumidores con index signature) y, donde no había
mejor opción, con un cast mínimo en el consumidor (`Movements.tsx`,
`BudgetDetailModal.tsx`) o `reduce<number>` explícito en 13 callbacks de
`walletAnalyzer.ts` (su `t: unknown` heredado de cuando el helper era `any`
hacía que `reduce` resolviera al overload sin acumulador). Cero cambios de
runtime en el código migrado: en los diffs contra HEAD solo cambian firmas,
anotaciones, casts erasables, un `+a - +b` en lugar de restar `Date`s
(mismo `valueOf`) y el cast local de `getPrimaryAmount`.

**Retrabajos sobre el trabajo de agy (hechos por Claude):**
- `budgetCoverage.ts`: los tipos de entrada de agy dejaban 14 errores de tsc
  en `BudgetsClient`/`BudgetEditModal`/`BudgetDetailModal` (category como
  objeto en vez de `unknown`, index signatures que los consumidores no tienen,
  `Result` como `interface` no asignable a `SpendingSummaryCoverage`).
- `categoriesTransformers.ts`: agy agregó 3 veces `&& item.fatherCategory !==
  null` dentro de `if (item.fatherCategory)`: guard no forzado (compila igual
  sin él) e inalcanzable; se quitó para dejar el archivo fiel al original.

**Corrección de hoy en `getPrimaryAmount`:** acepta `PrimaryAmountItem | object`
porque el weak-type check de TS rechazaba objetos sin campos en común (p. ej.
`TransResumeTransaction`) aunque el helper es duck-typed por diseño.

**28 bugs de comportamiento nuevos** preservados sin arreglar (filas 92-119).
Los más relevantes: los tres `sort` que mutan el array recibido (con arrays
congelados de Redux lanzarían), `buildCategoryHierarchy` con el mismo crash de
`category._id` del bug #24 pero ahora en el helper compartido,
`getBudgetActualSpend` que ignora multi-moneda y no excluye fechas inválidas,
facturas contadas en cada budget con el que calzan, y el fallback a `"MXN"`
en las entradas de baseline sin `currency`.

**Nota de proceso:** los 2 archivos grandes fueron auto-revisados por Claude
(sin revisor independiente, tal como se pidió); la evidencia es el diff contra
HEAD, tsc/eslint limpios y los tests existentes (`transactionsChange.test.js`,
`projectionsChange.test.js`, `walletAnalyzer.test.js`, 324/324 en total).
Con esta historia el total de fixes de seguridad se mantiene en **42** y el
de bugs pendientes llega a **119**.

## 2026-09-30 — Historia 17 (API routes restantes) completa: 13/13 archivos

Las 13 rutas de `general-data/*` que seguían en `.js` (todas alcanzables sin autenticar porque el middleware solo cubre `/dashboard/*`): `user/remove-user`, `tags/new|remove|update`, `wallet`, `category-rules/apply-suggestions|suggest`, `general-data/[id]`, `general-data` (raíz) y `files/upload|deduplicate|export|template`. Migradas por agy en 3 tandas y auditadas una por una por Claude.

**12 fixes de seguridad nuevos (#43-54)**, todos del mismo patrón ya visto: identidad tomada del mail/id que manda el cliente en lugar de `auth.api.getSession`. La única que ya tenía el fix era `wallet` (solo se migró). Las más graves: `remove-user` (borraba cualquier cuenta y todos sus datos), los dos volcados completos por mail (`general-data` y `[id]`), `upload` (inyectar transacciones en cualquier cuenta) y `deduplicate` (borrar transacciones ajenas). Los call sites reales de cliente ya mandaban el correo de su propia sesión, así que ningún flujo legítimo cambió. Las rutas destructivas no se ejercitaron en vivo: se verificaron con tsc, eslint y vitest (los 2 tests de `files/*` solo ganaron el mock de `getSession`).

**Retrabajos hechos por Claude sobre el trabajo de agy** (mismo tipo de error repetido, ya dejado como regla en los prompts): schemas Zod exportados que nunca validaban nada, `|| {}` agregado a `request.json()` (cambia el comportamiento con body null), `if (!sheet) return ...` en las 4 rutas de Excel, un `?.` extra en el catch de `template`, y filtros `user` de más en `category-rules/suggest` que podían ocultar reglas existentes (el original ya acotaba por wallet, relación 1:1 con el usuario).

**Hallazgo abierto (no corregido, decisión pendiente del usuario):** los volcados de `general-data` y `general-data/[id]` devuelven el documento User con `password` (hash) y `apiTokens.tokenHash`, y `[id]` lo escribe en los logs del servidor. Ninguna pantalla llama a esas rutas (solo hay código comentado), así que lo más limpio sería borrarlas o quitar esos campos.

**13 bugs de comportamiento nuevos** preservados sin arreglar (filas 120-132). Nuevo archivo `src/types/xlsx-populate.d.ts` (la librería no trae tipos). Con esta historia el total de fixes de seguridad de toda la migración pasa de 42 a **54**.

## TO-DOs PENDIENTES (decisión del usuario, 2026-09-30: posponer hasta después de la migración)

Estos dos puntos se dejaron adrede para después. **Claude debe recordárselos al usuario al terminar la migración y siempre que pregunte "qué quedó pendiente"**, junto con la tabla de bugs pendientes.

1. **Datos sensibles en los volcados de `general-data`** (hallazgo de la Historia 17). `general-data/route.ts` (POST) y `general-data/[id]/route.ts` (GET) devuelven el documento User completo en `data.user`, incluyendo `password` (hash) y `apiTokens` (con `tokenHash`); `[id]` además hace `console.log(userFound)` y lo escribe en los logs del servidor. Hoy solo lo ve el dueño de la cuenta (ya tienen el fix de sesión) y ninguna pantalla llama a estas rutas (solo hay código comentado en `apiSlice.js` / `generalDataApiRedux.js`). Decisión a tomar: **borrar las dos rutas** (lo más limpio si de verdad son código muerto) o quitar esos campos de la respuesta y el `console.log`.

   **Ampliación verificada el 2026-09-30 (el problema es más grande que las dos rutas):**
   - **Logs, lo más grave (rutas VIVAS):** `user/update-user` hace `console.log(dataRequest)` (línea 55) y `console.log(userFounded)` (línea 122). La pantalla de Perfil (`ProfileClient.tsx:191`) manda `password` y `passwordConfirm` en texto plano en ese body cuando alguien cambia su contraseña, así que **la contraseña nueva en texto plano se escribe en los logs del servidor**; el segundo log vuelca además el documento User (hash de `password` y `apiTokens`).
   - **Respuestas al navegador (rutas VIVAS):** `transactions/get-all`, `categories/get-all` y `user/get-user` ya ponen `password` en null/"" pero siguen mandando `apiTokens` (con `tokenHash`) y se guardan en el estado Redux de cada sesión; `user/update-user` devuelve el documento completo (hash de `password` y `apiTokens`) sin limpiar.
   - **Rutas muertas:** `general-data` (POST) y `general-data/[id]` (GET) devuelven el User completo con el hash de `password` sin limpiar; `[id]` además lo loguea.
   - El cliente no lee `apiTokens` ni `password` del estado del usuario (solo hay un tipo declarado en `userSlice.ts`), así que quitarlos de las respuestas no rompe ninguna pantalla.

2. **`user/remove-user` debe exigir la verificación en dos pasos (step-up 2FA).** Es una operación destructiva (borra la cuenta y todos los datos). Ya exige sesión (fix #43), pero no usa el mecanismo de step-up que ya existe en la app (`src/lib/auth/markStepUpVerified.ts`). Hay que revisar cómo se exige en las otras operaciones sensibles y aplicarlo aquí. Además esta ruta no tiene ningún call site en la UI hoy (solo un comentario en `markStepUpVerified.ts`): confirmar si se usa antes de invertir en ella.

## 2026-09-30 — Historia 18 (Fundaciones) completa: 17/17 archivos

Los archivos de base que decenas de archivos ya migrados consumían como `any` implícito: `dbConnection.ts` (50 importadores), `fetcher.ts` (38), `gastifyNotifier.ts` (29), los modelos `Wallet.ts` y `CategoryRule.ts`, `moneySchemas.ts`, el núcleo de dinero (`conversion.ts`, `ecbClient.ts`, `transactionMoney.ts`, `transactionMoneyService.ts`), `gastifyTemplate.ts`, los slices `tagsSlice.ts`/`loadGeneralDataSlice.ts`, `useLinkedAccountsTotal.ts` y los helpers `downloadBackupCodes.ts`, `orderFunctions.ts`, `defaultIconsDB.ts`. Migrados por agy en 2 tandas y auditados por Claude. **Sin fixes de seguridad.**

**Resultado más limpio que en la Historia 16:** ninguno de los ~130 consumidores necesitó cambios para compilar con los tipos nuevos. Además, al tipar `Wallet` y `CategoryRule` se **borraron todos los typed bridges** (`WalletModelBridge` en 11 archivos y `CategoryRuleModelBridge`; `grep` confirma 0 restantes) y el `wallet: any` de `provisionNewUserData.ts`.

**Retrabajos hechos por Claude sobre el trabajo de agy (2 cambios de comportamiento colados):**
- `transactionMoney.ts`: `Math.abs(amount || 0)` pasó a `Math.abs(Number(amount) || 0)` (un valor no numérico pasaba de dar NaN a 0); revertido a la expresión original con un cast que se borra al compilar.
- `useLinkedAccountsTotal.ts`: `majorToMinor(a?.amount || 0, ...)` se envolvió en `Number(...)`; `majorToMinor` ya hace `Number()` y lanza si el valor no es finito, así que con un monto no numérico pasaba de lanzar a valer 0. Revertido.

El único `any` explícito nuevo es el default genérico de `fetcher` (`<T = any>` en `get`/`post`), justificado porque los endpoints devuelven JSON de forma variable consumido de distintas formas por ~38 archivos. **5 bugs de comportamiento nuevos** preservados (filas 133-137). Los tests de `conversion`, `ecbClient`, `transactionMoney` y `transactionMoneyService` siguen pasando (324/324 en total).

## 2026-09-30 — Historia 19 (Top3 y movimientos históricos) completa: 16/16 archivos

`TransactionItemList`, `BasicTooltip`, `TooltipForChart`, `AtomicTop`, `TopCategoryRow`, `TopTransactionRow`, `TopElementsCompareTable`, `TopMonthItem`, `TopMonthContainer`, `TopRankColumn`, `TopElementContainerView`, `HistoricalMovementsView` (tanda A, 12 archivos) y `ModalContentTopMonthItem` (704 líneas), `TopElementsContainer`, `HistoricalMovementsController` y `propsColTabsToggler` (tanda B). Migrados por agy y auditados por Claude. **Sin fixes de seguridad** (UI pura).

**Retrabajos de Claude sobre agy:** en `ModalContentTopMonthItem` agy coló 8 guards que el compilador no exigía (`item?.`, `t?._id` y un `Boolean(id) &&` que cambiaba qué ids pasaban el filtro), todos revertidos tras comprobar con tsc; en `propsColTabsToggler` reemplacé los `String(...)` de las keys por casts erasables; en `TopElementContainerView` cambié dos `any` explícitos por `object`/`unknown`. Al migrar el modal se borraron sus bridges temporales en 3 componentes de la tanda A y el de `HistoricalMovementsController` en `HistoryClient`. **Pendiente menor de limpieza:** quedan bridges `TypedModalContentTopMonthItem` (con `item: unknown`) en 4 consumidores de historias anteriores (`HistoricalComparativeCategories`, `HistoricalWalletAnalyzer`, `WalletAnalyzerInsightsStrip`, `WalletAnalyzerView`); quitarlos exige casts en ~10 sitios, no aporta seguridad y se dejó.

**6 filas de bugs nuevas** (138-143), sin tocar comportamiento. Verificación: tsc, eslint (0 errores) y vitest 324/324; no se probó la UI en el navegador.

## 2026-09-30 — Historia 20 (UI restante) completa: 21/21 archivos

Categorías (`SelectCategoryBtn`, `CategoryCircle`, `CategoryCircleWithChilds`, `CategoriesModalList`, `CategorySearchedItem`, `SearchInput`, `RenderCategoriesSearch`), utilidades (`AmountEquivalentPreview`, `CategorySuggestionsModal`, `ChargedElsewhereSection`, `ToolsFab`, `ToolsModal`, hook `useTransactionAmountEquivalent`) y los componentes de negocio (`BudgetCont`, `UnbudgetedSpending`, `CreditCard`, `DedupPreviewModal`, `TabsTrans`, `ResumeTabsTrans`, `ColumnChartAntComparative`, `ResponsiveBarsChartComponent`). Migrados por agy en 2 tandas y auditados por Claude. **Sin fixes de seguridad.** Se borraron ~15 bridges tipados de consumidores ya migrados.

**La tanda A (13 archivos chicos) salió limpia.** **La tanda B (8 grandes) trajo el mismo tipo de error de siempre, esta vez en componentes con dinero:** en `CreditCard` agy agregó `cardColor` a las dependencias de un `useEffect`, un `|| ""` sobre `cardColor`, y cambió el estado inicial de `account` de `[]` a `null` con `?.` en cuatro lugares; en `UnbudgetedSpending` puso fallbacks `|| 0`/`?.` en el resumen y `|| ""` en el payload de crear presupuesto; en `TabsTrans` agregó fallbacks, un `String(...)` y cambió el modificador `"2.3"` por el número 2.3; en `DedupPreviewModal` un `|| ""` y un `Number(...)`; en `ResponsiveBarsChartComponent` `data || []`; y en `BudgetsClient` descartó un fallback a string. Todo revertido por Claude tras comprobar que el compilador no lo exigía (los cambios inertes como `let`→`const`, imports/estado muerto y `catch` sin variable sí se aceptaron).

**6 filas de bugs nuevas** (144-149). Verificación: tsc, eslint (0 errores) y vitest 324/324; sin probar la UI en el navegador.

## 2026-09-30 — Historia 21 (Entradas de Next y providers) completa: 4/4 archivos. MIGRACIÓN DE `src/` TERMINADA

`ReduxProvider`, `AllDataProvider`, `app/layout` y `app/page`, migrados por agy y auditados por Claude; sin cambios de seguridad. 4 filas de bugs nuevas (150-153).

**Hallazgo importante de esta historia: `next build` estaba roto.** Al correr el build de producción por primera vez desde que empezó la migración, falló porque 11 rutas migradas en las Historias 8 y 14 exportaban su schema de Zod, y un `route.ts` de Next.js solo puede exportar handlers (`GET`, `POST`...) y config. Ni tsc, ni eslint, ni vitest lo detectan; solo `next build`. Se quitó el `export` de esos schemas (ninguno se usaba fuera de su archivo; 10 de ellos solo eran fuente de tipo y llevan un `eslint-disable` con nota). Ahora `next build` compila todas las rutas. **Regla desde aquí: correr `next build` al cerrar cada historia que toque rutas o páginas.**

### Estado final

- **`.js`/`.jsx` en `src/` (sin tests): 26, todos código muerto** que el usuario decidió ignorar por ahora (no se migran ni se borran). Los tests (`*.test.js`), `scripts/` y los configs raíz se quedan en JavaScript.
- **Historias 1-21 completas.** Fixes de seguridad totales: **54**. Bugs de comportamiento documentados sin arreglar: **153** (tabla de arriba).
- Verificación final: `tsc --noEmit` limpio, `eslint` 0 errores, `vitest` 324/324, `next build` OK.

### Pendientes para recordarle al usuario

1. Los dos TO-DOs de seguridad (sección "TO-DOs PENDIENTES" de este archivo): datos sensibles en `general-data` y `general-data/[id]`, y 2FA en `remove-user`.
2. La tabla de bugs pendientes (153 filas).
3. Decisión sobre los 26 archivos de código muerto.
4. Limpieza menor opcional: 4 bridges `TypedModalContentTopMonthItem` en consumidores de las Historias 12-13.
5. Nunca se probó la UI en el navegador durante las Historias 17-21 (solo tsc/eslint/vitest/next build).
6. `typescript-migration` sigue sin mergearse a `main` (a la espera de instrucción del usuario) y este archivo y `.mds/migration-typescript.md` se borran cuando el usuario dé el visto bueno final.
