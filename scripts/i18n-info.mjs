#!/usr/bin/env node
// The explanations ("?" texts) come from the language now: every file that imports a value from the info modules reads it
// from useInfo() instead, destructured at the top of the component that uses it. The import of the Spanish constant goes away.
// Uses outside a component (module-level constants, helper functions) are reported, to change them by hand.
//
//   node scripts/i18n-info.mjs [--dry] [file...]     (no files: every file under src/ and apps/ that imports the info modules)

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const explicit = args.filter((arg) => arg !== "--dry");

// Where each module lives: the core modules, and the mobile re-export shims that point at them.
const CORE = { app: "@gastify/core/info/appInfo", create: "@gastify/core/info/createInfo" };
const SOURCES = {
  "@gastify/core/info/appInfo": "app",
  "@gastify/core/info/createInfo": "create",
  "@/lib/info-sections": "app",
  "@/lib/create-info": "create",
};
const SHIMS = new Set(["@/lib/info-sections", "@/lib/create-info"]);
const VALUE_NAMES = new Set([
  "APP_INFO", "HERO_INFO", "HISTORY_INFO", "ACCURACY_HELP", "ACCURACY_SECTIONS", "VS_SECTIONS", "INSIGHTS_SECTIONS",
  "BUDGET_FACES_SECTIONS", "PROJECTION_MONTHS_SECTIONS", "PACE_SECTIONS", "CREATE_SCREEN_INFO", "CREATE_KIND_INFO", "CREATE_KIND_SUMMARY",
]);
const HOOK_IMPORT = 'import { useInfo } from "@/i18n/client";';
const HOOK_SOURCE = "@/i18n/client";

function candidateFiles() {
  if (explicit.length > 0) return explicit.map((file) => path.resolve(ROOT, file));
  const out = execSync(
    "grep -rlE --include='*.ts' --include='*.tsx' \"gastify/core/info/|@/lib/info-sections|@/lib/create-info\" src apps",
    { cwd: ROOT, encoding: "utf8" }
  );
  return out
    .split("\n")
    .filter(Boolean)
    .map((file) => path.resolve(ROOT, file))
    .filter((file) => !file.includes("node_modules") && !file.endsWith("apps/mobile/src/lib/info-sections.ts") && !file.endsWith("apps/mobile/src/lib/create-info.ts"));
}

function isComponent(node) {
  if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) return true;
  if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) && /^[A-Z]/.test(node.parent.name.text)) return true;
  return false;
}

function enclosingComponent(node) {
  for (let p = node.parent; p; p = p.parent) if (isComponent(p)) return p;
  return null;
}

// A value use of the name (not a declaration, not a property key or property name).
function isValueUse(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent)) && parent.name === node) return false;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return false;
  if (ts.isImportSpecifier(parent) || ts.isImportClause(parent) || ts.isExportSpecifier(parent)) return false;
  if (ts.isParameter(parent) && parent.name === node) return false;
  return true;
}

function applyEdits(text, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let out = text;
  for (const edit of sorted) out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  return out;
}

const manualReport = [];
let changed = 0;

for (const abs of candidateFiles()) {
  const rel = path.relative(ROOT, abs);
  const text = readFileSync(abs, "utf8");
  const kind = abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, kind);
  const edits = [];
  const names = new Set();
  const usedNames = new Map(); // component -> Set of names

  // 1) the imports: value names leave the import, type names stay (a shim's type names move to the core module)
  let hasHookImport = null;
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const source = statement.moduleSpecifier.text;
    if (source === HOOK_SOURCE) hasHookImport = statement;
    if (!SOURCES[source]) continue;
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
    const valueSpecs = [];
    const keep = [];
    for (const element of clause.namedBindings.elements) {
      if (!element.isTypeOnly && VALUE_NAMES.has(element.name.text)) {
        if (element.propertyName) manualReport.push(`${rel}: import con alias ${element.getText(sf)}`);
        valueSpecs.push(element);
        names.add(element.name.text);
      } else {
        keep.push(element);
      }
    }
    if (valueSpecs.length === 0) {
      // only types: a shim's type names move to the core module, so the shim can go
      if (SHIMS.has(source) && keep.length > 0) {
        const quote = statement.moduleSpecifier.getText(sf)[0];
        const newModule = `${quote}${CORE[SOURCES[source]]}${quote}`;
        edits.push({ start: statement.moduleSpecifier.getStart(sf), end: statement.moduleSpecifier.getEnd(), text: newModule });
      }
      continue;
    }
    const specsText = keep.map((element) => element.getText(sf)).join(", ");
    if (keep.length === 0 && !clause.name) {
      edits.push({ start: statement.getStart(sf), end: statement.getEnd(), text: "" });
    } else {
      const quote = statement.moduleSpecifier.getText(sf)[0];
      const module = SHIMS.has(source) ? `${quote}${CORE[SOURCES[source]]}${quote}` : statement.moduleSpecifier.getText(sf);
      const head = clause.name ? `${clause.name.getText(sf)}${keep.length ? ", " : ""}` : "";
      const named = keep.length ? `{ ${specsText} }` : "";
      edits.push({ start: statement.getStart(sf), end: statement.getEnd(), text: `import ${head}${named} from ${module};` });
    }
  }

  if (names.size === 0) {
    if (edits.length > 0) {
      if (!dry) writeFileSync(abs, applyEdits(text, edits), "utf8");
      changed += 1;
      console.log(`  ${rel}: solo tipos (shim movido al módulo core)`);
    }
    continue;
  }

  // 2) the uses: each component gets the names it reads, destructured from useInfo() at the top of its body
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isIdentifier(node) && names.has(node.text) && isValueUse(node)) {
      const component = enclosingComponent(node);
      if (!component || !component.body || !ts.isBlock(component.body)) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        manualReport.push(`${rel}:${line}: uso de ${node.text} fuera de un componente`);
      } else {
        if (!usedNames.has(component)) usedNames.set(component, new Set());
        usedNames.get(component).add(node.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  for (const [component, used] of usedNames) {
    const first = component.body.statements[0];
    const indent = first ? " ".repeat(sf.getLineAndCharacterOfPosition(first.getStart(sf)).character) : "  ";
    const list = [...used].sort().join(", ");
    edits.push({ start: component.body.getStart(sf) + 1, end: component.body.getStart(sf) + 1, text: `\n${indent}const { ${list} } = useInfo();` });
  }

  // 3) the hook import: added to the file's existing '@/i18n/client' import, or a new line before the first import
  if (usedNames.size > 0) {
    if (hasHookImport && hasHookImport.importClause?.namedBindings && ts.isNamedImports(hasHookImport.importClause.namedBindings)) {
      const bindings = hasHookImport.importClause.namedBindings;
      if (!bindings.elements.some((element) => element.name.text === "useInfo")) {
        const inner = bindings.getText(sf).replace(/\s*\}$/, ", useInfo }");
        const clauseText = hasHookImport.importClause.name ? `${hasHookImport.importClause.name.getText(sf)}, ${inner}` : inner;
        edits.push({ start: hasHookImport.getStart(sf), end: hasHookImport.getEnd(), text: `import ${clauseText} from "${HOOK_SOURCE}";` });
      }
    } else if (!hasHookImport) {
      const firstImport = sf.statements.find((statement) => ts.isImportDeclaration(statement));
      const at = firstImport ? firstImport.getStart(sf) : 0;
      edits.push({ start: at, end: at, text: `${HOOK_IMPORT}\n` });
    } else {
      manualReport.push(`${rel}: import de @/i18n/client sin llaves, añadir useInfo a mano`);
    }
  }

  const out = applyEdits(text, edits);
  if (!dry && out !== text) writeFileSync(abs, out, "utf8");
  changed += 1;
  const comps = [...usedNames.keys()].map((component) => (component.name?.text ?? component.parent?.name?.text ?? "?")).join(", ");
  console.log(`  ${rel}: ${[...names].join(", ")} -> ${comps || "(sin componente)"}`);
}

console.log(`\n${changed} archivos ${dry ? "(simulación)" : "cambiados"}.`);
if (manualReport.length > 0) {
  console.log(`\nA mano (${manualReport.length}):`);
  for (const line of manualReport) console.log(`  ${line}`);
}
