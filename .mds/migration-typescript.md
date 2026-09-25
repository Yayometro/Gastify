# Migración de Gastify a TypeScript — reglas y estado vivo

> Temporal: este archivo se borra cuando el usuario dé el visto bueno final a
> toda la migración. El historial permanente de hitos vive en
> [`migration-ts-logs.md`](migration-ts-logs.md).

## Regla de oro

**Nunca cambies comportamiento o lógica al migrar un archivo — solo agrega
tipos.** Si ves un bug real mientras migras, NO lo arregles tú: anótalo en el
`summary` de `submit_for_review` para que Claude lo evalúe aparte. La única
excepción son incompatibilidades que el propio compilador de TypeScript o el
chequeo de rutas de Next.js exigen para poder compilar (por ejemplo, un
`return` que no coincide con el tipo de retorno esperado) — esos sí se
corrigen, preservando el comportamiento en tiempo de ejecución exactamente
igual.

## Convención de tipos por categoría de archivo

- **Modelos Mongoose** (`src/model/*.js` → `.ts`): define `interface I<Nombre>`
  junto al schema, en el mismo archivo, reflejando los campos reales del
  schema (incluyendo campos legacy del multi-currency — quedan como
  opcionales, nunca se eliminan; ver `.mds/MULTI_CURRENCY_IMPLEMENTATION_PLAN.md`
  si hace falta contexto).
- **Rutas API** (`src/app/api/**/route.js` → `.ts`): tipa `request`/response.
  El proyecto ya usa `zod` como dependencia — prefiere definir el schema de
  validación de entrada con `zod` y derivar el tipo con `z.infer<>` en vez de
  escribir la interfaz a mano por separado. Cuidado especial: Next.js valida
  en build time que cada handler exportado retorne `void | Response` en
  TODAS sus ramas — revisa que ningún `return` regrese un objeto plano sin
  envolver en `NextResponse.json(...)`.
- **Componentes React** (`.jsx` → `.tsx`): tipa props explícitamente (nunca
  `any` implícito), usa los tipos de evento reales de React para handlers
  (`React.ChangeEvent<HTMLInputElement>`, etc.).
- **Slices de Redux** (`src/lib/features/*.js` → `.ts`): tipa el `state`
  inicial y el payload de cada reducer/acción; exporta el tipo del slice para
  poder componer `RootState` en `src/lib/store.js`.
- **Hooks** (`src/hooks/*.js` → `.ts`): tipa parámetros y valor de retorno
  explícito.

## Dónde viven los tipos compartidos

- `src/types/` para lo que cruza varios archivos (`RootState`, DTOs de API
  compartidos entre cliente y servidor, tipos de dinero/moneda reutilizados).
- Un tipo usado por un solo archivo se queda co-localizado ahí — no todo va a
  `src/types/`.

## Prohibido

- `any` implícito o explícito sin un comentario justificando por qué (caso
  raro: interoperar con una lib sin tipos).
- `// @ts-ignore` sin una nota explicando qué falta resolver.

## Checklist antes de `submit_for_review`

1. `npx tsc --noEmit` sobre el archivo (o el proyecto completo) sin errores
   nuevos atribuibles a este archivo.
2. Si el archivo tiene un test (`<archivo>.test.js` → confirmar que también
   se migra o al menos sigue pasando), correr `npx vitest run <archivo>`.
3. Solo si el archivo está marcado como **UI de alto riesgo** en la historia
   activa: abrir el navegador interno de Antigravity y confirmar que la
   pantalla/flujo relacionado sigue renderizando y funcionando igual que
   antes.
4. Llamar a `submit_for_review` en el MCP coordinator con un resumen real de
   qué cambió (no un genérico "migrado a TS").

## Estado vivo — historias de usuario

La fuente de verdad operativa (qué archivo está pendiente/reclamado/en
revisión/aprobado) vive en `tools/migration-coordinator/state.json`, servida
por el MCP server `gastify-ts-migration-coordinator` — consúltalo con
`list_files`/`get_story_status`, no asumas el estado leyendo este documento.

**Historia 1 — Login y autenticación completa: COMPLETA** (23/23 aprobados,
2026-09-23). Password+2FA, Google y passkey confirmados por el usuario en
vivo; registro y login por password puro quedaron pendientes de probar
(se harán después, no bloquean seguir). Dos archivos muertos/huérfanos
encontrados en el camino se borraron con aprobación del usuario, y un bug
de seguridad real fuera de alcance (IDOR en
`general-data/user/get-user/route.js`) se corrigió aparte de inmediato por
prioridad alta.

**Historia 1 (Login/Auth) y Historia 2 (Dashboard) completas.**

**Historia 3 (Profile) completa** - ProfileClient, ApiTokensPanel y sus 4
rutas de API. En el camino se encontraron y corrigieron 4 bugs de
seguridad IDOR reales fuera del flujo normal de migración (ver tabla en
`migration-ts-logs.md`) - mismo patron que el IDOR de `get-user` ya
corregido en Historia 1.

**Historia 4 (Componentes compartidos pequeños) completa** - 10/10
archivos (`CategoIcon`, `UniversalCategoIcon`, `EmptyModule`, `Tag`,
`SelecterFilter`, `SelecterItemsToDisplay`, `TimeRange`,
`MultiCreditCard`, `GoalBudget`, `DeletePreviewRow`). Ver
`migration-ts-logs.md` para la tabla consolidada de bugs pendientes
encontrados en el camino (no arreglados, fuera de alcance), incluyendo
la causa raiz confirmada del bug del dropdown de periodo del Dashboard
(`SelecterFilter.jsx`: `value: 30` duplicado entre "Last 30 days" y
"Last 90 days").

**Historia activa: Historia 5 — Accounts** (`dashboard/accounts/page.jsx`,
`AccountClient.jsx`, `EditAccountModal.jsx`, `PrimaryCurrencySelector.jsx`,
modelo `Account.js`, y las 4 rutas de API que usa directamente:
`reorder`, `update-account`, `new-account`, `remove-account`).
Deliberadamente NO incluye `ResumeTabsTrans`/`TransDetailsGrandContainer`/
`DisplayerCategoryTreemap` que renderiza `AccountClient.jsx` - esos
arrastran `CategoryTreemap` (666 lineas) y todo el arbol de analytics de
categorias, son su propia historia futura. `AccountClient.jsx` necesitara
bridges tipados para esos componentes sin migrar, mismo patron ya usado
con Movements/WalletAnalyzer en Historia 2.

Historias siguientes (orden real a confirmar): Movements/Transacciones,
Wallet Analyzer, Budgets, Categories (+ su arbol de analytics/treemap),
History, Projections, MCP tools. Los modelos Mongoose que aún faltan
(Wallet, Category, SubCategory, Budget, Transaction, Tag, IncomeSource,
CategoryRule, ProjectionSettings, ProjectionBaseline, FxRateSnapshot) se
migran conforme cada historia los necesite, no todos de un jalón.
`scripts/` sueltos al final.
