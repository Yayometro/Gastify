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
