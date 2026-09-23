#!/usr/bin/env node
// Migration-coordinator MCP server: the single source of truth Antigravity
// and Claude both connect to while migrating Gastify to TypeScript. Holds
// which file belongs to which "historia" (user-flow slice), its status
// (pending -> claimed -> submitted -> approved, or bounced back to
// needs_rework/pending), and a full per-file audit trail - so neither agent
// double-works a file, and Claude's second-pass review notes are recorded
// somewhere structured instead of scattered across chat/commit messages.
//
// Stdio transport: works as a local command both Claude Code's own MCP
// config and Antigravity's `~/.gemini/config/mcp_config.json` can launch
// directly (agy CLI, the IDE, and cloud agents all read that same config).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, "state.json");
const RULES_PATH = path.join(__dirname, "../../.mds/migration-typescript.md");

async function loadState() {
  return JSON.parse(await readFile(STATE_PATH, "utf8"));
}

async function saveState(state) {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function categoryHint(filePath) {
  if (filePath.includes("/model/")) return "Modelo de Mongoose - define/actualiza la interface I<Nombre> junto al schema.";
  if (filePath.includes("/app/api/") || filePath.endsWith("route.js") || filePath.endsWith("route.ts"))
    return "Ruta de API - tipa request/response; usa zod + z.infer si el body necesita validarse.";
  if (filePath.includes("/features/")) return "Slice de Redux - tipa el state inicial y el payload de cada acción.";
  if (filePath.endsWith(".jsx") || filePath.endsWith(".tsx")) return "Componente React - tipa props explícitamente, nunca 'any'.";
  if (filePath.includes("/hooks/")) return "Hook - tipa parámetros y valor de retorno.";
  return "Ver .mds/migration-typescript.md para la regla general aplicable.";
}

function findStory(state, storyId) {
  const id = storyId || state.activeStory;
  const story = state.stories[id];
  if (!story) throw new Error(`Historia desconocida: ${id}`);
  return { id, story };
}

function pushHistory(fileEntry, event, notes) {
  fileEntry.history.push({ ts: new Date().toISOString(), event, notes: notes || undefined });
}

const server = new McpServer({ name: "gastify-ts-migration-coordinator", version: "1.0.0" });

server.registerTool(
  "list_files",
  {
    description: "Lista los archivos de la migración TS, opcionalmente filtrando por estado y/o historia.",
    inputSchema: {
      status: z.enum(["pending", "claimed", "submitted", "needs_rework", "approved"]).optional(),
      story: z.string().optional(),
    },
  },
  async ({ status, story }) => {
    const state = await loadState();
    const { id, story: s } = findStory(state, story);
    const files = Object.entries(s.files)
      .filter(([, v]) => !status || v.status === status)
      .map(([p, v]) => ({ path: p, status: v.status }));
    return { content: [{ type: "text", text: JSON.stringify({ story: id, label: s.label, files }, null, 2) }] };
  }
);

server.registerTool(
  "claim_next_file",
  {
    description: "Reclama el siguiente archivo pendiente de la historia activa para migrarlo a TypeScript.",
    inputSchema: { story: z.string().optional() },
  },
  async ({ story }) => {
    const state = await loadState();
    const { id, story: s } = findStory(state, story);
    const next = Object.entries(s.files).find(([, v]) => v.status === "pending");
    if (!next) {
      return { content: [{ type: "text", text: JSON.stringify({ story: id, done: true, message: "No hay archivos pendientes en esta historia." }) }] };
    }
    const [filePath, entry] = next;
    entry.status = "claimed";
    pushHistory(entry, "claimed");
    await saveState(state);
    let rules = "";
    try {
      rules = await readFile(RULES_PATH, "utf8");
    } catch {
      rules = "(no se encontró .mds/migration-typescript.md todavía)";
    }
    const priorRework = entry.history.filter((h) => h.event === "needs_rework");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              story: id,
              path: filePath,
              categoryHint: categoryHint(filePath),
              rulesFile: ".mds/migration-typescript.md",
              rules,
              ...(priorRework.length > 0 && {
                reworkNotice:
                  "ESTE ARCHIVO YA FUE RECHAZADO ANTES EN REVISIÓN. Lee las notas exactas de por qué y corrige SOLO eso - no repitas el problema.",
                priorReworkNotes: priorRework.map((h) => h.notes),
              }),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerTool(
  "submit_for_review",
  {
    description: "Marca un archivo como migrado y listo para la revisión de Claude.",
    inputSchema: {
      path: z.string(),
      summary: z.string().describe("Resumen de qué se tipó/cambió en este archivo."),
      usedBrowserVerification: z.boolean().optional(),
    },
  },
  async ({ path: filePath, summary, usedBrowserVerification }) => {
    const state = await loadState();
    const { story: s } = findStory(state, null);
    const entry = Object.values(state.stories).flatMap((st) => (st.files[filePath] ? [st.files[filePath]] : []))[0]
      || s.files[filePath];
    if (!entry) return { content: [{ type: "text", text: `Archivo no encontrado en ninguna historia: ${filePath}` }], isError: true };
    entry.status = "submitted";
    pushHistory(entry, "submitted", `${summary}${usedBrowserVerification ? " (verificado en navegador)" : ""}`);
    await saveState(state);
    return { content: [{ type: "text", text: `Registrado: ${filePath} está en cola de revisión.` }] };
  }
);

server.registerTool(
  "get_review_queue",
  { description: "Lista los archivos con estado 'submitted', listos para que Claude los revise.", inputSchema: {} },
  async () => {
    const state = await loadState();
    const queue = [];
    for (const [storyId, s] of Object.entries(state.stories)) {
      for (const [p, v] of Object.entries(s.files)) {
        if (v.status === "submitted") queue.push({ story: storyId, path: p, lastNote: v.history.at(-1)?.notes });
      }
    }
    return { content: [{ type: "text", text: JSON.stringify(queue, null, 2) }] };
  }
);

server.registerTool(
  "submit_review",
  {
    description: "Registra el veredicto de la revisión de Claude sobre un archivo.",
    inputSchema: {
      path: z.string(),
      verdict: z.enum(["approved", "needs_rework"]),
      notes: z.string().optional(),
    },
  },
  async ({ path: filePath, verdict, notes }) => {
    const state = await loadState();
    let entry;
    for (const s of Object.values(state.stories)) if (s.files[filePath]) entry = s.files[filePath];
    if (!entry) return { content: [{ type: "text", text: `Archivo no encontrado: ${filePath}` }], isError: true };
    entry.status = verdict === "approved" ? "approved" : "pending";
    pushHistory(entry, verdict === "approved" ? "approved" : "needs_rework", notes);
    await saveState(state);
    return { content: [{ type: "text", text: `${filePath} -> ${entry.status}` }] };
  }
);

server.registerTool(
  "get_story_status",
  {
    description: "Cuenta cuántos archivos de una historia (o la activa) están en cada estado.",
    inputSchema: { story: z.string().optional() },
  },
  async ({ story }) => {
    const state = await loadState();
    const { id, story: s } = findStory(state, story);
    const counts = {};
    for (const v of Object.values(s.files)) counts[v.status] = (counts[v.status] || 0) + 1;
    const total = Object.keys(s.files).length;
    const complete = (counts.approved || 0) === total;
    return { content: [{ type: "text", text: JSON.stringify({ story: id, label: s.label, total, counts, complete }, null, 2) }] };
  }
);

server.registerTool(
  "get_file_history",
  { description: "Historial completo de auditoría de un archivo.", inputSchema: { path: z.string() } },
  async ({ path: filePath }) => {
    const state = await loadState();
    let entry;
    for (const s of Object.values(state.stories)) if (s.files[filePath]) entry = s.files[filePath];
    if (!entry) return { content: [{ type: "text", text: `Archivo no encontrado: ${filePath}` }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
