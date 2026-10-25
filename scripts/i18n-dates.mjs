#!/usr/bin/env node
// The Spanish date helpers (format/spanishDates) become the language-aware ones (i18n/dates): every call gets the locale,
// and each component or hook that calls one reads it with useLocale(). The import changes with them.
//
//   node scripts/i18n-dates.mjs [--dry] [file...]     (no files: every file under src/ and apps/mobile/src that imports spanishDates)

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

const SOURCE = "@gastify/core/format/spanishDates";
const CORE_DATES = "@gastify/core/i18n/dates";
const CLIENT = "@/i18n/client";

// A call of the old name becomes a call of the new one with the extra arguments it now takes.
const CALLS = {
  monthTitleEs: { to: "monthTitle", extra: ["locale"] },
  longDateEs: { to: "longDate", extra: ["locale"] },
  rangeLabelEs: { to: "rangeLabel", extra: ["locale"] },
};
// A list read by index becomes a name read with the locale.
const INDEXED = {
  MONTHS_ES: { to: "monthName", extra: ["locale"] },
  MONTHS_ES_SHORT: { to: "monthName", extra: ["locale", '"short"'] },
};

function candidateFiles() {
  if (explicit.length > 0) return explicit.map((file) => path.resolve(ROOT, file));
  const out = execSync(`grep -rl "spanishDates" src apps/mobile/src --include='*.ts' --include='*.tsx' || true`, { cwd: ROOT, encoding: "utf8" });
  return out
    .split("\n")
    .filter(Boolean)
    .map((file) => path.resolve(ROOT, file));
}

// A component, or a hook (useX): the places where a hook may be called.
function isHostFunction(node) {
  const named = (name) => /^[A-Z]/.test(name) || /^use[A-Z]/.test(name);
  if (ts.isFunctionDeclaration(node) && node.name && named(node.name.text)) return true;
  if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) && named(node.parent.name.text)) return true;
  return false;
}

function enclosingHost(node) {
  for (let p = node.parent; p; p = p.parent) if (isHostFunction(p) && p.body && ts.isBlock(p.body)) return p;
  return null;
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
  const hosts = new Map(); // host function -> { locale: bool }
  const used = new Set();
  let importDecl = null;
  let clientImport = null;

  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (statement.moduleSpecifier.text === SOURCE) importDecl = statement;
    if (statement.moduleSpecifier.text === CLIENT) clientImport = statement;
  }
  if (!importDecl) continue;

  const visit = (node) => {
    if (ts.isImportDeclaration(node)) return;
    // monthTitleEs(x) -> monthTitle(x, locale)
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CALLS[node.expression.text]) {
      const rule = CALLS[node.expression.text];
      const host = enclosingHost(node);
      if (!host) {
        manualReport.push(`${rel}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}: ${node.expression.text} fuera de un componente o hook`);
      } else {
        hosts.set(host, true);
        used.add(rule.to);
        const argText = node.arguments.map((arg) => arg.getText(sf)).join(", ");
        edits.push({ start: node.getStart(sf), end: node.getEnd(), text: `${rule.to}(${[argText, ...rule.extra].filter(Boolean).join(", ")})` });
      }
      node.arguments.forEach(visit);
      return;
    }
    // MONTHS_ES[i] -> monthName(i, locale)
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && INDEXED[node.expression.text]) {
      const rule = INDEXED[node.expression.text];
      const host = enclosingHost(node);
      if (!host) {
        manualReport.push(`${rel}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}: ${node.expression.text} fuera de un componente o hook`);
      } else {
        hosts.set(host, true);
        used.add(rule.to);
        edits.push({ start: node.getStart(sf), end: node.getEnd(), text: `${rule.to}(${[node.argumentExpression.getText(sf), ...rule.extra].join(", ")})` });
      }
      visit(node.argumentExpression);
      return;
    }
    // MONTHS_ES.map(...) and any other use of the lists: by hand
    if (ts.isIdentifier(node) && (INDEXED[node.text] || node.text === "WEEKDAYS_ES") && node.parent && !ts.isImportSpecifier(node.parent) && !ts.isElementAccessExpression(node.parent)) {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      manualReport.push(`${rel}:${line}: uso de ${node.text} como lista, cambiar a mano`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // the hooks each host needs: useLocale() at the top of the host (before any early return)
  for (const host of hosts.keys()) {
    const body = host.body.getText(sf);
    if (/\blocale\b\s*=/.test(body) || /\bconst \{[^}]*\blocale\b[^}]*\} =/.test(body)) {
      const line = sf.getLineAndCharacterOfPosition(host.getStart(sf)).line + 1;
      manualReport.push(`${rel}:${line}: ya declara locale, revisar a mano`);
      continue;
    }
    const first = host.body.statements[0];
    const indent = first ? " ".repeat(sf.getLineAndCharacterOfPosition(first.getStart(sf)).character) : "  ";
    edits.push({ start: host.body.getStart(sf) + 1, end: host.body.getStart(sf) + 1, text: `\n${indent}const locale = useLocale();` });
  }

  // imports: the core functions in use replace the old import; the client hooks join the client import
  const dateNames = [...used].sort();
  const dateImport = dateNames.length > 0 ? `import { ${dateNames.join(", ")} } from "${CORE_DATES}";` : "";
  edits.push({ start: importDecl.getStart(sf), end: importDecl.getEnd(), text: dateImport });
  if (hosts.size > 0) {
    if (clientImport && clientImport.importClause?.namedBindings && clientImport.importClause.namedBindings.getText(sf).includes("{")) {
      const bindings = clientImport.importClause.namedBindings;
      if (!/\buseLocale\b/.test(bindings.getText(sf))) {
        const inner = bindings.getText(sf).replace(/\s*\}$/, ", useLocale }");
        edits.push({ start: clientImport.getStart(sf), end: clientImport.getEnd(), text: `import ${inner} from "${CLIENT}";` });
      }
    } else if (!clientImport) {
      edits.push({ start: importDecl.getStart(sf), end: importDecl.getStart(sf), text: `import { useLocale } from "${CLIENT}";\n` });
    }
  }

  const out = applyEdits(text, edits);
  if (!dry && out !== text) writeFileSync(abs, out, "utf8");
  changed += 1;
  console.log(`  ${rel}: ${dateNames.join(", ") || "(sin llamadas)"} -> ${hosts.size} componente(s)/hook(s)`);
}

console.log(`\n${changed} archivos ${dry ? "(simulación)" : "cambiados"}.`);
if (manualReport.length > 0) {
  console.log(`\nA mano (${manualReport.length}):`);
  for (const line of manualReport) console.log(`  ${line}`);
}
