# AGENTS.md — rama `typescript-migration` únicamente

Este archivo es exclusivo de la rama `typescript-migration` y de la tarea de
migrar Gastify a TypeScript. **No reemplaza ningún `rules.md`/`AGENTS.md`
global que ya uses en tu flujo multi-AI** — solo aplica mientras trabajas en
este repo, en esta rama, en esta tarea.

Las reglas completas de esta migración (convenciones de tipado, checklist de
verificación por archivo, y el estado vivo de las historias de usuario en
curso) viven en [`.mds/migration-typescript.md`](.mds/migration-typescript.md).
Léelo completo antes de reclamar cualquier archivo.

Coordínate con el servidor MCP `gastify-ts-migration-coordinator` (ya
registrado en `~/.gemini/config/mcp_config.json`): usa `claim_next_file` para
pedir tu siguiente archivo, `submit_for_review` cuando termines cada uno, y
nunca toques un archivo que no hayas reclamado ahí.

**Este archivo y `.mds/migration-typescript.md` se borran cuando el usuario dé
el visto bueno final a toda la migración.** El registro permanente queda en
`.mds/migration-ts-logs.md`, que sí sobrevive.
