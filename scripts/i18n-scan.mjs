#!/usr/bin/env node
// Phase 0 of the i18n plan (.mds/I18N_PLAN.md): finds the user-facing text in the web app, the mobile app, the API and the
// shared core, and writes .mds/I18N_INVENTORY.md. It parses the code with the TypeScript compiler, so it sees JSX text,
// the attributes a person reads (placeholder, title, aria-label...), the messages the API sends back, Alert.alert buttons
// and the notifications the UI shows. It is a heuristic floor, not an exact count: strings built in pieces, text that
// only reaches the screen through a variable, and text inside long templates are not all caught.
//
// Run from the repo root:  node scripts/i18n-scan.mjs

import { createRequire } from "node:module";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".mds", "I18N_INVENTORY.md");

const SOURCES = [
  { area: "web", dir: "src" },
  { area: "mobile", dir: "apps/mobile/src" },
  { area: "core", dir: "packages/core/src" },
];

const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "dist", "build"]);
const SKIP_FILE = /\.(test|spec)\.[tj]sx?$|\.d\.ts$/;

// Attributes a person reads on screen.
const TEXT_ATTRS = new Set([
  "placeholder", "title", "aria-label", "aria-description", "alt", "label", "tooltip", "emMessage", "description", "subtitle",
  "accessibilityLabel", "accessibilityHint",
]);
// Object keys that carry text in the API responses.
const API_TEXT_KEYS = new Set(["message", "error", "msg", "title", "text", "label"]);
// Object keys that carry text in the shared core (labels, notices, validation messages).
const CORE_TEXT_KEYS = new Set(["title", "label", "message", "text", "description", "placeholder", "tooltip", "subtitle", "emMessage", "hint"]);
// Functions that show a notice to the person.
const NOTIFY_CALL = /^(runNotify|notify|toast|showError|showToast|setError|setMessage|showMessage)$/i;

// Ordered: the first rule that matches a web file decides its zone. The inicio pages come first on purpose.
const WEB_ZONES = [
  ["inicio", /^src\/app\/page\.tsx$/],
  ["auth (login, registro, 2FA, passkeys)", /login|register|verify-2fa|passkey|signin|signup|\/auth\//i],
  ["wallet-analyzer", /analyzer/i],
  ["movements (incl. import y categorizador)", /movement|transaction|trans[a-z]*|import|readfile|duplicate|categorizer|categorysuggest|toolsmodal|addtransaction|quickedit|editmulti/i],
  ["budgets", /budget/i],
  ["accounts", /account/i],
  ["categories", /categor|subcat/i],
  ["profile", /profile/i],
  ["projections", /projection/i],
  ["history", /history|historical|monthly|compare/i],
  ["navbar y accesos rápidos", /navbar|nav(?!ig)|quickadd|quick-add|notification|bell|fab|sidebar|menu/i],
  ["dashboard", /dashboard|wallet|top|resumen|credit|summary/i],
];

const LETTER = /\p{L}/u;

// A string is user text when it has letters and reads like a sentence or a capitalised word. Bare identifiers, class lists,
// routes and urls are code, not text.
function looksLikeText(value) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 3 || !LETTER.test(text)) return false;
  if (/^(https?:|\/|#|\.)/.test(text)) return false;
  if (!/\s/.test(text) && !/^\p{Lu}/u.test(text) && !/[áéíóúñ¿¡]/i.test(text)) return false;
  return true;
}

function staticString(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(" {x} ");
  return null;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !SKIP_FILE.test(entry.name)) out.push(path.join(dir, entry.name));
  }
  return out;
}

function zoneOf(area, rel) {
  if (area === "web") {
    if (rel.startsWith("src/app/api/")) {
      const match = rel.match(/general-data\/([^/]+)/);
      return `api/${match ? match[1] : "otras"}`;
    }
    for (const [zone, pattern] of WEB_ZONES) if (pattern.test(rel)) return zone;
    return "compartidos (componentes)";
  }
  if (area === "mobile") {
    const parts = rel.split("/"); // apps/mobile/src/<...>
    const inner = parts.slice(3);
    if (inner[0] === "app") return `mobile/app/${inner[1] && !inner[1].endsWith(".tsx") ? inner[1] : "raíz"}`;
    if (inner[0] === "components") return `mobile/components/${inner[1] && !inner[1].endsWith(".tsx") ? inner[1] : "raíz"}`;
    return `mobile/${inner[0] || "otros"}`;
  }
  // core: packages/core/src/<folder>/...
  const parts = rel.split("/");
  return `core/${parts[3] || "raíz"}`;
}

const KIND_LABEL = {
  "jsx-text": "texto JSX",
  attr: "atributo visible",
  api: "mensaje de API",
  alert: "Alert.alert",
  notify: "aviso al usuario",
  core: "texto del core",
};

function scanFile(file, area, rel) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const hits = [];
  const add = (kind, node, value) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    hits.push({ kind, line, sample: value.replace(/\s+/g, " ").trim().slice(0, 100) });
  };
  const isApi = rel.startsWith("src/app/api/");

  const insideAlert = (node) => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (ts.isCallExpression(parent)) return parent.expression.getText(sf) === "Alert.alert";
    }
    return false;
  };

  const visit = (node) => {
    // Console output is for developers, never for the person.
    if (ts.isCallExpression(node) && node.expression.getText(sf).startsWith("console.")) return;

    if (ts.isJsxText(node)) {
      const value = node.getText(sf);
      if (looksLikeText(value)) add("jsx-text", node, value);
    } else if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
      const value = staticString(node.expression);
      if (value !== null && looksLikeText(value)) add("jsx-text", node, value);
    } else if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && TEXT_ATTRS.has(node.name.text) && node.initializer) {
      const init = node.initializer;
      const value = ts.isStringLiteral(init) ? init.text : ts.isJsxExpression(init) ? staticString(init.expression) : null;
      if (value !== null && looksLikeText(value)) add("attr", node, `${node.name.text}: ${value}`);
    }

    if (isApi) {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && API_TEXT_KEYS.has(node.name.text)) {
        const value = staticString(node.initializer);
        if (value !== null && looksLikeText(value)) add("api", node, value);
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Error" && node.arguments?.length) {
        const value = staticString(node.arguments[0]);
        if (value !== null && looksLikeText(value)) add("api", node, value);
      }
    }

    if (area === "mobile") {
      if (ts.isCallExpression(node) && node.expression.getText(sf) === "Alert.alert") {
        for (const arg of node.arguments.slice(0, 2)) {
          const value = staticString(arg);
          if (value !== null && looksLikeText(value)) add("alert", arg, value);
        }
      }
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === "text" && insideAlert(node)) {
        const value = staticString(node.initializer);
        if (value !== null && looksLikeText(value)) add("alert", node, value);
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "";
      if (NOTIFY_CALL.test(name)) {
        for (const arg of node.arguments) {
          const value = staticString(arg);
          if (value !== null && looksLikeText(value)) {
            add("notify", arg, value);
            break;
          }
        }
      }
    }

    if (area === "core") {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && CORE_TEXT_KEYS.has(node.name.text)) {
        const init = ts.isArrowFunction(node.initializer) ? node.initializer.body : node.initializer;
        const value = staticString(init);
        if (value !== null && looksLikeText(value)) add("core", node, value);
      }
      // Validation messages written as errors.field = "..." (see profileForm, accountForm...).
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && node.left.expression.getText(sf) === "errors") {
        const value = staticString(node.right);
        if (value !== null && looksLikeText(value)) add("core", node, value);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);
  return hits;
}

// ---- collect ----------------------------------------------------------------------------------------------------------
const files = [];
for (const source of SOURCES) {
  for (const file of walk(path.join(ROOT, source.dir))) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    files.push({ area: source.area, file, rel });
  }
}

const perFile = [];
for (const { area, file, rel } of files) {
  const hits = scanFile(file, area, rel);
  if (hits.length === 0) continue;
  perFile.push({ area, rel, zone: zoneOf(area, rel), hits });
}

const counts = (hits) => {
  const result = Object.fromEntries(Object.keys(KIND_LABEL).map((kind) => [kind, 0]));
  for (const hit of hits) result[hit.kind] += 1;
  return result;
};

const byZone = new Map();
for (const entry of perFile) {
  if (!byZone.has(entry.zone)) byZone.set(entry.zone, { files: [], total: 0, kinds: Object.fromEntries(Object.keys(KIND_LABEL).map((k) => [k, 0])) });
  const zone = byZone.get(entry.zone);
  const perKind = counts(entry.hits);
  zone.files.push({ ...entry, perKind, total: entry.hits.length });
  zone.total += entry.hits.length;
  for (const kind of Object.keys(KIND_LABEL)) zone.kinds[kind] += perKind[kind];
}

// The inicio pages are reported on their own, with samples, so the first screens can be checked by hand.
const inicio = perFile.filter((entry) => entry.zone === "inicio");

const totals = Object.fromEntries(Object.keys(KIND_LABEL).map((k) => [k, 0]));
for (const entry of perFile) for (const hit of entry.hits) totals[hit.kind] += 1;
const grandTotal = Object.values(totals).reduce((sum, n) => sum + n, 0);
const areaTotals = {};
for (const entry of perFile) areaTotals[entry.area] = (areaTotals[entry.area] || 0) + entry.hits.length;

// ---- report -----------------------------------------------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const lines = [];
const push = (...text) => lines.push(...text);

push(
  "# Inventario de textos para la i18n",
  "",
  `Generado el ${today} con \`node scripts/i18n-scan.mjs\`. Es la Fase 0 de [I18N_PLAN.md](I18N_PLAN.md).`,
  "",
  "Es un conteo de **piso**, no exacto: encuentra el texto JSX, los atributos que lee la persona, los mensajes de la API, los botones de `Alert.alert`, los avisos (`runNotify`, `toast`...) y los textos del core. No ve texto armado en piezas, texto que solo llega a la pantalla por una variable ni plantillas largas. Cada conteo es una cadena candidata; algunas son nombres de ejemplo o datos, no texto de interfaz.",
  "",
  "## Totales",
  "",
  "| Área | Archivos con texto | Textos |",
  "|---|---:|---:|",
);
for (const area of ["web", "mobile", "core"]) {
  const filesInArea = perFile.filter((entry) => entry.area === area).length;
  push(`| ${area} | ${filesInArea} | ${areaTotals[area] || 0} |`);
}
push(`| **Total** | **${perFile.length}** | **${grandTotal}** |`);
const distinct = new Set();
for (const entry of perFile) for (const hit of entry.hits) distinct.add(hit.sample.toLowerCase());
push(`\nTextos distintos: ${distinct.size} (un mismo texto aparece en varias pantallas; el trabajo de traducción cuenta una vez cada texto distinto).`);
push(
  "",
  "Por tipo: " + Object.keys(KIND_LABEL).map((kind) => `${KIND_LABEL[kind]} ${totals[kind]}`).join(" · "),
  "",
  "## Inicio y pantallas públicas",
  "",
  "Las páginas que se ven antes de entrar: `/` (inicio), `/login`, `/register` y `/verify-2fa`. Son las primeras que debe ver el usuario en su idioma.",
  "",
);
if (inicio.length === 0) {
  push("_No se encontraron textos en la página de inicio._", "");
} else {
  push("| Archivo | Textos |", "|---|---:|");
  for (const entry of inicio) push(`| \`${entry.rel}\` | ${entry.hits.length} |`);
  push("");
}
const publicAuth = perFile.filter((entry) => entry.zone.startsWith("auth"));
push(`Pantallas de autenticación (login, registro, 2FA, passkeys): ${publicAuth.reduce((sum, e) => sum + e.hits.length, 0)} textos en ${publicAuth.length} archivos.`, "");

push("## Por zona", "", "| Zona | Archivos | Texto JSX | Atributos | API | Alertas | Avisos | Core | Total |", "|---|---:|---:|---:|---:|---:|---:|---:|---:|");
const zonesSorted = [...byZone.entries()].sort((a, b) => b[1].total - a[1].total);
for (const [zone, data] of zonesSorted) {
  const k = data.kinds;
  push(`| ${zone} | ${data.files.length} | ${k["jsx-text"]} | ${k.attr} | ${k.api} | ${k.alert} | ${k.notify} | ${k.core} | **${data.total}** |`);
}
push("");

push("## Checklist por zona", "", "Cada archivo con sus textos. Marca la casilla cuando esté migrado y sin texto fijo.", "");
for (const [zone, data] of zonesSorted) {
  push(`<details><summary><strong>${zone}</strong> — ${data.total} textos en ${data.files.length} archivos</summary>`, "");
  const sorted = [...data.files].sort((a, b) => b.total - a.total);
  for (const file of sorted) {
    const detail = Object.entries(file.perKind).filter(([, n]) => n > 0).map(([kind, n]) => `${KIND_LABEL[kind]} ${n}`).join(", ");
    push(`- [ ] \`${file.rel}\` — ${file.total} (${detail})`);
  }
  push("", "</details>", "");
}

push("## Muestras de la página de inicio", "", "Lo que se encontró en `/`, `/login`, `/register` y `/verify-2fa`, para revisar a mano:", "");
for (const entry of inicio) {
  push(`**\`${entry.rel}\`**`, "");
  for (const hit of entry.hits.slice(0, 25)) push(`- L${hit.line} · ${KIND_LABEL[hit.kind]} · "${hit.sample}"`);
  if (entry.hits.length > 25) push(`- …y ${entry.hits.length - 25} más`);
  push("");
}

push(
  "## Límites del conteo",
  "",
  "- **Qué sí cuenta:** texto JSX, atributos visibles, mensajes de la API (`message`, `error`, `new Error(...)`), botones y textos de `Alert.alert`, avisos al usuario, y en el core las claves `title`, `label`, `message`, `text`, `description`, `placeholder`, `tooltip`, `subtitle`, `emMessage`, `hint` y las validaciones `errors.campo = \"...\"`.",
  "- **Qué no cuenta:** texto que se arma con concatenación o variables antes de mostrarse; textos dentro de `className`, claves y valores de datos; los nombres de categorías y bancos que vienen de la base de datos; los textos de `.js`/`.jsx` (ya no quedan en `src/`).",
  "- **Falsos positivos posibles:** ejemplos en comentarios de código de prueba, nombres de iconos o de monedas que pasan la heurística. Se revisan al migrar la zona.",
  "- **Zonas:** se asignan por el nombre del archivo y la carpeta. Un archivo compartido por dos pantallas cae en la primera zona que coincide; el listado completo está en el checklist.",
  "",
);

const report = lines.join("\n") + "\n";
writeFileSync(OUT, report, "utf8");

console.log(`Inventario escrito en ${path.relative(ROOT, OUT)}`);
console.log(`Archivos con texto: ${perFile.length} · textos: ${grandTotal}`);
for (const area of ["web", "mobile", "core"]) console.log(`  ${area}: ${areaTotals[area] || 0}`);
console.log(`Inicio: ${inicio.reduce((sum, e) => sum + e.hits.length, 0)} textos en ${inicio.length} archivo(s)`);
