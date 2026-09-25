# Auditoría de seguridad de endpoints de API — checklist

> **Esto NO es parte de la migración a TypeScript.** Es una tarea aparte,
> pedida explícitamente por el usuario el 2026-09-25 después de que la
> migración destapó 8 bugs de control de acceso reales (ver
> `migration-ts-logs.md`) en rutas que ya se habían tocado por casualidad.
> La migración solo revisa a fondo el archivo que le toca en cada historia -
> este documento existe para, en algún momento aparte, revisar **absolutamente
> todos** los endpoints de `src/app/api/`, reciban o envíen la información que
> reciban/envíen, y confirmar que tienen la verificación de sesión/usuario
> correcta con la implementación nueva de Better Auth (`auth.api.getSession()`).

## Por qué hace falta

`middleware.ts` solo protege páginas (`matcher: ["/dashboard/:path*"]`) - las
rutas de API NO están cubiertas por el middleware. Eso significa que un
endpoint sin su propio `auth.api.getSession()` es alcanzable por cualquiera,
autenticado o no, no solo por "el usuario equivocado". Se encontraron 8
instancias de esta familia de bug (IDOR o directamente cero autenticación)
sin buscarlas deliberadamente - solo revisando de paso los archivos que la
migración fue tocando. Es muy probable que haya más entre las ~47 rutas que
todavía no se han revisado a fondo.

## Los 8 ya confirmados y corregidos (no hace falta re-revisarlos)

| Ruta | Problema | Commit |
|------|----------|--------|
| `general-data/user/get-user` (GET) | IDOR de lectura | `1370e56` |
| `general-data/user/update-user` (POST) | IDOR de escritura | `bb8f987` |
| `general-data/api-tokens/list` | IDOR de lectura | `a9e8f17` |
| `general-data/api-tokens/remove` | IDOR de escritura | `a9e8f17` |
| `general-data/api-tokens/new` | IDOR de escritura (crítico) | `a9e8f17` |
| `general-data/accounts/reorder` | Cero sesión | `94723a3` |
| `general-data/accounts/update-account` | Cero sesión | `94723a3` |
| `general-data/accounts/new-account` | Cero sesión | `94723a3` |
| `general-data/accounts/remove-account` | Cero sesión (crítico - borrado) | `94723a3` |
| `general-data/wallet/get-wallet` | IDOR de lectura (review miss de Historia 2) | `b8897fc` |
| `general-data/wallet` (POST) | Cero sesión | `b8897fc` |

## Metodología sugerida para la auditoría completa

Por cada ruta:
1. ¿Recibe o modifica datos específicos de un usuario/wallet/cuenta? Si es
   puramente informativo/estático (ej. catálogos, listas de tipos de cambio
   públicas), puede que no necesite sesión - juzgar caso por caso.
2. Si sí opera sobre datos de un usuario: ¿deriva ese usuario de
   `auth.api.getSession({ headers: request.headers })`, o confía en algo que
   manda el cliente (`mail`, `userId`, `walletId`, un id de recurso sin
   verificar ownership)?
3. Si el recurso es un `id` suelto (accountId, transactionId, categoryId,
   etc.): ¿el query que lo busca está acotado también al wallet/usuario de la
   sesión (`{ _id, wallet: ... }`), o busca solo por `_id` a secas (permite
   operar sobre el recurso de cualquier otro usuario si se adivina/conoce el
   id)?
4. Rutas con un mecanismo de auth *distinto* a la sesión de cookies (ej. los
   tokens de conector MCP) son válidas siempre que ESE mecanismo esté bien
   implementado - no se les debe exigir `getSession()`, se les debe auditar
   con su propio criterio (¿se verifica el hash del token, se compara con
   timing-safe compare, etc.?).

## Estado heurístico (grep automático de `getSession`, 2026-09-25)

**Importante**: esto es un proxy rápido, no una auditoría real. Un "NO" no
significa necesariamente un bug - puede usar otro mecanismo de auth válido
(el caso de `/mcp/*`, que se autentica por token de conector, no por sesión)
o legítimamente no necesitar ninguno (`/register`, el catch-all de
`/api/auth/[...all]`). Cada fila con "NO" que no esté en la lista de
"probablemente OK" de abajo necesita revisión manual real.

### Ya confirmadas con `getSession()` correcto (arregladas esta sesión)
- `general-data/accounts/new-account`
- `general-data/accounts/remove-account`
- `general-data/accounts/reorder`
- `general-data/accounts/update-account`
- `general-data/api-tokens/list`
- `general-data/api-tokens/new`
- `general-data/api-tokens/remove`
- `general-data/user/get-user`
- `general-data/user/update-user`
- `general-data/wallet/get-wallet`
- `general-data/wallet` (POST)
- `auth-extra/mark-step-up`

### Probablemente OK sin `getSession()` propio (confirmar de todas formas)
- `auth/[...all]/route.ts` - el catch-all de Better Auth, maneja su propia auth internamente.
- `register/route.ts` - registro de cuenta nueva, no hay sesión previa que verificar.
- `mcp/route.js`, `mcp/[token]/route.js` - se autentican via token de conector (el que se generó en `api-tokens/new`), no via sesión de cookies. Confirmar que el token se valida correctamente (hash comparado de forma segura, expiración si aplica) - criterio distinto a `getSession()`.

### Pendientes de revisión manual real (sin `getSession()` detectado, sin mecanismo alternativo confirmado)

**Accounts (parcial)**
- [ ] `general-data/accounts/get-account` (GET/POST) - ¿confía en un mail/id del body?

**Budget**
- [ ] `general-data/budget/get`
- [ ] `general-data/budget/get-historical`
- [ ] `general-data/budget/new`
- [ ] `general-data/budget/remove`
- [ ] `general-data/budget/update`

**Categories / SubCategories / Category Rules**
- [ ] `general-data/categories/get-all`
- [ ] `general-data/categories/get-categories`
- [ ] `general-data/categories/new-category`
- [ ] `general-data/categories/remove-category`
- [ ] `general-data/categories/update-category`
- [ ] `general-data/category-rules/apply-suggestions`
- [ ] `general-data/category-rules/suggest`
- [ ] `general-data/subcategory/get-sub-categories`
- [ ] `general-data/subcategory/new`
- [ ] `general-data/subcategory/remove`
- [ ] `general-data/subcategory/update`

**Files**
- [ ] `general-data/files/deduplicate/[id]`
- [ ] `general-data/files/export/[email]` - el `[email]` en la ruta es sospechoso, revisar con prioridad si viene del cliente sin verificar sesión.
- [ ] `general-data/files/template/[email]` - mismo comentario que arriba.
- [ ] `general-data/files/upload/[id]`

**FX / Income sources / Projections**
- [ ] `general-data/fx/quote` - probablemente público (cotizaciones), confirmar que no filtra nada sensible.
- [ ] `general-data/income-sources/get`
- [ ] `general-data/income-sources/new`
- [ ] `general-data/income-sources/remove`
- [ ] `general-data/income-sources/update`
- [ ] `general-data/projection-baseline/delete`
- [ ] `general-data/projection-baseline/get`
- [ ] `general-data/projection-baseline/update`
- [ ] `general-data/projections/get`
- [ ] `general-data/projections/update`

**Tags**
- [ ] `general-data/tags/new`
- [ ] `general-data/tags/remove`
- [ ] `general-data/tags/update`

**Transactions (el grupo más grande y más sensible - dinero real)**
- [ ] `general-data/transactions/[id]`
- [ ] `general-data/transactions/edit-many`
- [ ] `general-data/transactions/get-all`
- [ ] `general-data/transactions/get-transactions`
- [ ] `general-data/transactions/link-budget`
- [ ] `general-data/transactions/new-transaction`
- [ ] `general-data/transactions/remove-many`
- [ ] `general-data/transactions/remove-transaction/[id]`
- [ ] `general-data/transactions/speech-add`
- [ ] `general-data/transactions/transfer`
- [ ] `general-data/transactions/transfer/remove`

**User**
- [ ] `general-data/user/remove-user` - borrado de cuenta, prioridad alta si no tiene verificación.

**Genéricas**
- [ ] `general-data/[id]/route.js` - ruta dinámica genérica, revisar qué hace.
- [ ] `general-data/route.js` - raíz de general-data, revisar qué hace.

## Cómo usar este checklist más adelante

Cuando el usuario quiera atacar esto: tomar cada `[ ]` pendiente, leer el
archivo, aplicar la metodología de arriba, y si tiene el mismo bug de fondo
(confiar en algo del cliente en vez de la sesión), arreglarlo con el mismo
patrón ya usado 8 veces en esta migración: `auth.api.getSession(request.headers)`
+ derivar el recurso del usuario de la sesión, nunca del body/params sin
verificar. Marcar `[x]` conforme se van revisando/arreglando, y mover
cualquier hallazgo nuevo a la tabla de "confirmados y corregidos" de arriba.
