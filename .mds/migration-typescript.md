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

**Historia activa: Historia 1 — Login y autenticación completa** (password,
Google, passkeys/biométricos, 2FA con TOTP/backup codes). No reclames
archivos de otra historia todavía; el orden después de esta se define junto
con el usuario al cerrarla.

Historias siguientes (orden real a confirmar, Dashboard es solo ejemplo):
Dashboard, Profile, History, y luego el resto (Accounts, Budgets,
Categories, Movements, Projections, Wallet/Analyzer, MCP tools). `scripts/`
sueltos al final.
