#!/usr/bin/env node
// The migration tool for the i18n work (.mds/I18N_PLAN.md). It works one namespace at a time:
//
//   node scripts/i18n-work.mjs plan  <namespace> <file...>   finds the texts, gives each distinct text a key, and writes
//                                                             .mds/i18n-work/<namespace>.todo.json for the translations.
//   node scripts/i18n-work.mjs apply <namespace> <file...>   rewrites those files to use t("key"), adds the hook and the
//                                                             import, and writes packages/core/src/i18n/messages/{es,en}/
//                                                             <namespace>.ts from the todo file. Texts it cannot rewrite
//                                                             safely are listed in .mds/i18n-work/<namespace>.manual.md.
//
// Only pure texts are rewritten: a text next to variables or other elements ("Llevas {n} de 3") needs a hand-written key with
// parameters, so it goes to the manual list. Texts outside a component (module constants) go there too.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, ".mds", "i18n-work");
const CATALOGS = path.join(ROOT, "packages", "core", "src", "i18n", "messages");
const HOOK_IMPORT = 'import { useT } from "@/i18n/client";';

const TEXT_ATTRS = new Set([
  "placeholder", "title", "aria-label", "aria-description", "alt", "label", "tooltip", "emMessage", "description", "subtitle",
  "accessibilityLabel", "accessibilityHint",
]);
// Object keys that hold text in the component code (options lists, steps, notices).
const TEXT_PROPS = new Set(["title", "label", "message", "text", "description", "placeholder", "tooltip", "subtitle", "hint", "error", "copy", "caption"]);
const NOTIFY_CALL = /^(runNotify|notify|toast|showError|showToast|setError|setMessage|showMessage)$/i;
const HOOK_HINT = /\buse(State|Effect|Selector|Dispatch|Context|Memo|Callback|Ref|Router|Reducer|LayoutEffect)\b/;

const LETTER = /\p{L}/u;
function looksLikeText(value) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 2 || !LETTER.test(text)) return false;
  if (/^(https?:|\/|#|\.)/.test(text)) return false;
  if (!/\s/.test(text) && !/^\p{Lu}/u.test(text) && !/[áéíóúñ¿¡]/i.test(text)) return false;
  return true;
}

// The HTML entities JSX text may carry, turned back into the characters they stand for.
function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function slugify(text) {
  const words = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);
  return words.join(".") || "text";
}

function isUseClient(sf) {
  const first = sf.statements[0];
  return Boolean(first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text === "use client");
}

function componentName(node) {
  if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) return node.name.text;
  if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) && /^[A-Z]/.test(node.parent.name.text)) {
    return node.parent.name.text;
  }
  return null;
}

// The nearest component (a capitalised function) around a node: its name and the node, or null outside any component.
function componentOf(node) {
  for (let p = node.parent; p; p = p.parent) {
    const name = componentName(p);
    if (name) return { name, node: p };
  }
  return null;
}

function staticString(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

// The name the hook gets in this file: `t`, unless the file already uses an identifier `t` for something else.
function hookName(sf) {
  let taken = false;
  const visit = (node) => {
    if (taken) return;
    if (ts.isIdentifier(node) && node.text === "t") {
      taken = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return taken ? "tr" : "t";
}

// Does a node contain JSX elements anywhere below it? A text that holds one cannot be rewritten as one message.
function containsJsx(node) {
  let found = false;
  const visit = (child) => {
    if (found) return;
    if (ts.isJsxElement(child) || ts.isJsxFragment(child) || ts.isJsxSelfClosingElement(child)) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, visit);
  return found;
}

// A text sentence mixed with variables inside one element ("Llevas {n} de 3"): one message with {p1}, {p2}... placeholders.
// Only when nothing but text and plain {expressions} sit between the first and the last text (no elements, no strings).
function mixedText(node, sf) {
  const kids = node.children;
  const meaningful = kids.filter((k) => !(ts.isJsxText(k) && k.getText(sf).trim() === ""));
  if (meaningful.length < 2) return null;
  if (!meaningful.every((k) => ts.isJsxText(k) || (ts.isJsxExpression(k) && k.expression))) return null;
  if (!meaningful.some((k) => ts.isJsxText(k) && LETTER.test(k.getText(sf)))) return null;
  const from = kids.indexOf(meaningful[0]);
  const to = kids.indexOf(meaningful[meaningful.length - 1]);
  let text = "";
  const params = {};
  const consumed = [];
  let n = 0;
  for (let i = from; i <= to; i += 1) {
    const k = kids[i];
    if (ts.isJsxText(k)) {
      text += decodeEntities(k.getText(sf)).replace(/\s+/g, " ");
      consumed.push(k);
    } else if (ts.isJsxExpression(k) && k.expression && ts.isStringLiteral(k.expression)) {
      // {" "} is the space React needs between two elements: it is text, not a value.
      text += decodeEntities(k.expression.text).replace(/\s+/g, " ");
    } else if (ts.isJsxExpression(k) && k.expression) {
      if (containsJsx(k.expression)) return null;
      n += 1;
      params[`p${n}`] = k.expression.getText(sf);
      text += `{p${n}}`;
    }
  }
  const source = text.replace(/\s+/g, " ").trim();
  if (!LETTER.test(source.replace(/\{p\d+\}/g, " "))) return null;
  const first = kids[from];
  const last = kids[to];
  const firstRaw = ts.isJsxText(first) ? first.getText(sf) : "";
  const lastRaw = ts.isJsxText(last) ? last.getText(sf) : "";
  const start = ts.isJsxText(first) ? first.getStart(sf) + (firstRaw.length - firstRaw.trimStart().length) : first.getStart(sf);
  const end = ts.isJsxText(last) ? last.getEnd() - (lastRaw.length - lastRaw.trimEnd().length) : last.getEnd();
  return { start, end, source, params, consumed };
}

// Finds every text in one file. Each candidate says what to replace and what kind of text it is.
function collect(file, rel) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const client = isUseClient(sf) || HOOK_HINT.test(text);
  const candidates = [];
  const push = (entry) => candidates.push({ file: rel, ...entry });
  const consumed = new Set();

  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(sf).startsWith("console.")) return;

    if ((ts.isJsxElement(node) || ts.isJsxFragment(node)) && !consumed.has(node)) {
      const mixed = mixedText(node, sf);
      if (mixed) {
        for (const child of mixed.consumed) consumed.add(child);
        push({ kind: "mixed", start: mixed.start, end: mixed.end, source: mixed.source, params: mixed.params, pure: true, component: componentOf(node) });
      }
    }

    if (ts.isJsxText(node)) {
      if (consumed.has(node)) {
        ts.forEachChild(node, visit);
        return;
      }
      const raw = node.getText(sf);
      const value = decodeEntities(raw).replace(/\s+/g, " ").trim();
      // Anything with letters between JSX tags is shown to the person, even a single lowercase word ("your").
      if (LETTER.test(value)) {
        const siblings = node.parent.children.filter((child) => !(ts.isJsxText(child) && child.getText(sf).trim() === ""));
        const lead = raw.length - raw.trimStart().length;
        const start = node.getStart(sf) + lead;
        // A text next to an element is still a whole fragment ("You already spent"): it is translated as its own message.
        push({ kind: "jsx-text", start, end: start + raw.trim().length, source: value, pure: true, component: componentOf(node) });
      }
    } else if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && TEXT_ATTRS.has(node.name.text) && node.initializer) {
      const init = node.initializer;
      const literal = ts.isStringLiteral(init) ? init : ts.isJsxExpression(init) && ts.isStringLiteral(init.expression) ? init.expression : null;
      if (literal && looksLikeText(literal.text)) {
        push({ kind: "attr", start: literal.getStart(sf), end: literal.getEnd(), source: literal.text, pure: true, component: componentOf(node), inJsxExpr: ts.isJsxExpression(init) });
      }
    } else if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression) && !ts.isJsxAttribute(node.parent)) {
      const literal = node.expression;
      if (looksLikeText(literal.text)) push({ kind: "expr-string", start: literal.getStart(sf), end: literal.getEnd(), source: literal.text, pure: true, component: componentOf(node) });
    } else if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && TEXT_PROPS.has(node.name.text)) {
      const literal = ts.isStringLiteral(node.initializer) ? node.initializer : null;
      if (literal && looksLikeText(literal.text)) push({ kind: "prop", start: literal.getStart(sf), end: literal.getEnd(), source: literal.text, pure: true, component: componentOf(node) });
    } else if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Error" && node.arguments && ts.isStringLiteral(node.arguments[0]) && looksLikeText(node.arguments[0].text)) {
      const arg = node.arguments[0];
      push({ kind: "code-string", start: arg.getStart(sf), end: arg.getEnd(), source: arg.text, pure: true, component: componentOf(node) });
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "";
      if (NOTIFY_CALL.test(name) || callee.getText(sf) === "Alert.alert") {
        for (const arg of node.arguments.slice(0, 2)) {
          if (ts.isStringLiteral(arg) && looksLikeText(arg.text)) {
            push({ kind: "code-string", start: arg.getStart(sf), end: arg.getEnd(), source: arg.text, pure: true, component: componentOf(node) });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { sf, client, candidates, text };
}

function slugKey(namespace, source, used) {
  const base = `${namespace}.${slugify(source)}`;
  let key = base;
  let n = 2;
  while (used.has(key)) key = `${base}.${n++}`;
  used.add(key);
  return key;
}

function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
}

function plan(namespace, files) {
  mkdirSync(WORK, { recursive: true });
  const todoFile = path.join(WORK, `${namespace}.todo.json`);
  const previous = readJson(todoFile, { namespace, entries: [] });
  const known = new Map(previous.entries.map((entry) => [entry.source, entry]));
  const used = new Set(previous.entries.map((entry) => entry.key));
  const sources = new Set();
  for (const rel of files) {
    for (const candidate of collect(path.join(ROOT, rel), rel).candidates) sources.add(candidate.source);
  }
  const entries = [];
  for (const source of sources) {
    const existing = known.get(source);
    entries.push(existing ?? { key: slugKey(namespace, source, used), source, es: source, en: "" });
  }
  // The texts rewritten before are not in these files any more, but their keys are still in use: they stay.
  for (const entry of previous.entries) if (!sources.has(entry.source)) entries.push(entry);
  writeFileSync(todoFile, JSON.stringify({ namespace, entries }, null, 2) + "\n", "utf8");
  const pending = entries.filter((entry) => !entry.es || !entry.en).length;
  console.log(`${namespace}: ${entries.length} textos distintos en ${files.length} archivo(s). Pendientes de traducir: ${pending}. → ${path.relative(ROOT, todoFile)}`);
}

// The components of a parsed file that carry text, by name, in source order.
function componentsByName(sf) {
  const found = new Map();
  const visit = (node) => {
    const name = componentName(node);
    if (name && ts.isBlock(node.body ?? ts.factory.createBlock([])) && !found.has(name)) found.set(name, node);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

// Makes the namespace known to the app: it goes in the NAMESPACES list and gets a loader in both languages. Idempotent.
function registerNamespace(namespace) {
  const file = path.join(ROOT, "packages", "core", "src", "i18n", "catalogs.ts");
  let src = readFileSync(file, "utf8");
  const list = src.match(/export const NAMESPACES = \[([^\]]*)\] as const;/);
  if (!list) throw new Error("catalogs.ts: no se encontró la lista NAMESPACES");
  if (!list[1].includes(`"${namespace}"`)) {
    src = src.replace(list[0], `export const NAMESPACES = [${list[1].trimEnd()}${list[1].trim() ? ", " : ""}"${namespace}"] as const;`);
  }
  for (const locale of ["es", "en"]) {
    const line = `    ${namespace}: () => import("./messages/${locale}/${namespace}"),`;
    if (src.includes(line)) continue;
    const header = `  ${locale}: {`;
    const at = src.indexOf(header);
    if (at < 0) throw new Error(`catalogs.ts: no se encontró el bloque ${locale}`);
    const end = src.indexOf("\n", at) + 1;
    src = src.slice(0, end) + line + "\n" + src.slice(end);
  }
  writeFileSync(file, src, "utf8");
}

// The entries of a catalog file already written (Spanish or English), so a new round adds to it and does not drop keys.
function readCatalogEntries(lang, namespace) {
  const file = path.join(CATALOGS, lang, `${namespace}.ts`);
  if (!existsSync(file)) return {};
  const text = readFileSync(file, "utf8");
  const head = /const \w+(?:: [^=]+)? = \{/.exec(text);
  const end = text.lastIndexOf("}", text.indexOf("export default"));
  if (!head || end < 0) throw new Error(`No puedo leer ${path.relative(ROOT, file)}`);
  return new Function(`return {${text.slice(head.index + head[0].length, end)}};`)();
}

function apply(namespace, files) {
  const todoFile = path.join(WORK, `${namespace}.todo.json`);
  const todo = readJson(todoFile, null);
  if (!todo) throw new Error(`No hay ${path.relative(ROOT, todoFile)}. Corre plan primero.`);
  const untranslated = todo.entries.filter((entry) => !entry.es || !entry.en);
  if (untranslated.length > 0) {
    throw new Error(`Faltan ${untranslated.length} traducciones en ${path.relative(ROOT, todoFile)} (por ejemplo: "${untranslated[0].source}").`);
  }
  const byText = new Map(todo.entries.map((entry) => [entry.source, entry]));

  const manual = [];
  let rewritten = 0;
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    const { sf, client, candidates, text } = collect(abs, rel);
    const todoHere = [];
    for (const candidate of candidates) {
      const entry = byText.get(candidate.source);
      const line = sf.getLineAndCharacterOfPosition(candidate.start).line + 1;
      if (!entry) {
        manual.push({ file: rel, line, source: candidate.source, reason: "no está en el archivo de traducciones: corre plan otra vez" });
        continue;
      }
      const reason =
        !candidate.pure ? "texto junto a elementos o expresiones que no se pueden reescribir solos" :
        !candidate.component ? "fuera de un componente (no hay dónde poner el hook)" :
        !ts.isBlock(candidate.component.node.body ?? ts.factory.createBlock([])) ? "componente con cuerpo de expresión" :
        null;
      if (reason) {
        manual.push({ file: rel, line, source: candidate.source, reason });
        continue;
      }
      todoHere.push({ ...candidate, key: entry.key });
    }
    if (todoHere.length === 0) continue;

    const fn = hookName(sf);
    // Only the pages and layouts under src/app are server components; any other component is rendered by the client.
    const clientMode = !(rel.startsWith("src/app/") && !client);
    const names = new Set(todoHere.map((item) => item.component.name));

    // 1) The texts, replaced from the end of the file backwards so the earlier positions stay valid.
    let out = text;
    for (const item of [...todoHere].sort((a, b) => b.start - a.start)) {
      const params = item.params ? `, { ${Object.entries(item.params).map(([name, expr]) => `${name}: ${expr}`).join(", ")} }` : "";
      const call = `${fn}("${item.key}"${params})`;
      const replacement = item.kind === "jsx-text" || item.kind === "mixed" ? `{${call}}` : item.kind === "attr" && !item.inJsxExpr ? `{${call}}` : call;
      out = out.slice(0, item.start) + replacement + out.slice(item.end);
    }

    // 2) In each component that now uses the translator: the hook (client) or the awaited server translator, and for a
    // server component the `async` that the await needs. Found again in the rewritten file by name.
    const reparsed = ts.createSourceFile(abs, out, ts.ScriptTarget.Latest, true, abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const components = componentsByName(reparsed);
    const inserts = [];
    for (const name of names) {
      const node = components.get(name);
      if (!node) continue;
      const body = node.body;
      // A component that already has its translator (an earlier run) gets nothing new.
      if (body.getText(reparsed).includes(`const ${fn} = useT()`) || body.getText(reparsed).includes(`const ${fn} = await serverT(`)) continue;
      const firstStatement = body.statements[0];
      const indent = firstStatement ? " ".repeat(reparsed.getLineAndCharacterOfPosition(firstStatement.getStart(reparsed)).character) : "  ";
      const line = clientMode
        ? `\n${indent}const ${fn} = useT();`
        : `\n${indent}const ${fn} = await serverT(["${namespace}"]);`;
      inserts.push({ at: body.getStart(reparsed) + 1, text: line });
      if (!clientMode) {
        const isAsync = Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword));
        if (!isAsync) {
          const keyword = ts.isFunctionDeclaration(node) ? node.getChildren(reparsed).find((c) => c.kind === ts.SyntaxKind.FunctionKeyword) : null;
          const at = keyword ? keyword.getStart(reparsed) : node.getStart(reparsed);
          inserts.push({ at, text: "async " });
        }
      }
    }
    for (const insert of inserts.sort((a, b) => b.at - a.at)) {
      out = out.slice(0, insert.at) + insert.text + out.slice(insert.at);
    }

    // 3) The import, after the last import (or after "use client" when there is none).
    const importLine = clientMode ? HOOK_IMPORT : 'import { serverT } from "@/i18n/server";';
    if (clientMode && rel.startsWith("src/") && !isUseClient(reparsed)) out = '"use client";\n' + out;
    if (!out.includes(importLine)) {
      const check = ts.createSourceFile(abs, out, ts.ScriptTarget.Latest, true, abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const imports = check.statements.filter((statement) => ts.isImportDeclaration(statement));
      const anchor = imports.length > 0 ? imports[imports.length - 1].getEnd() : isUseClient(check) ? check.statements[0].getEnd() : 0;
      out = out.slice(0, anchor) + `\n${importLine}` + out.slice(anchor);
    }

    writeFileSync(abs, out, "utf8");
    rewritten += todoHere.length;
    console.log(`  ${rel}: ${todoHere.length} textos (${clientMode ? "cliente" : "servidor"})`);
  }

  // The catalogs, from the todo file: the same keys in Spanish and English.
  const es = { ...readCatalogEntries("es", namespace) };
  const en = { ...readCatalogEntries("en", namespace) };
  for (const entry of todo.entries) {
    es[entry.key] = entry.es;
    en[entry.key] = entry.en;
  }
  const esFile = `// Texts of the "${namespace}" namespace. Spanish is the source text.\nconst ${namespace} = ${JSON.stringify(es, null, 2)} as const;\n\nexport default ${namespace};\n`;
  const enFile = `import type ${namespace} from "../es/${namespace}";\n\n// English for the "${namespace}" namespace. Same keys as the Spanish catalog.\nconst en: Record<keyof typeof ${namespace}, string> = ${JSON.stringify(en, null, 2)};\n\nexport default en;\n`;
  writeFileSync(path.join(CATALOGS, "es", `${namespace}.ts`), esFile, "utf8");
  writeFileSync(path.join(CATALOGS, "en", `${namespace}.ts`), enFile, "utf8");
  registerNamespace(namespace);

  const manualFile = path.join(WORK, `${namespace}.manual.md`);
  const lines = [`# Textos que hay que tocar a mano (${namespace})`, "", "| Archivo | Línea | Texto | Motivo |", "|---|---:|---|---|"];
  for (const item of manual) lines.push(`| \`${item.file}\` | ${item.line} | ${item.source.replace(/\|/g, "\\|")} | ${item.reason} |`);
  writeFileSync(manualFile, lines.join("\n") + "\n", "utf8");
  console.log(`${namespace}: ${rewritten} textos reescritos · ${manual.length} para revisar a mano → ${path.relative(ROOT, manualFile)}`);
}

// `--zone <name>` takes the files of a zone from .mds/i18n-work/zones.json (the inventory's zones).
const [command, namespace, ...rest] = process.argv.slice(2);
let files = rest;
if (rest[0] === "--zone") {
  const zones = readJson(path.join(WORK, "zones.json"), {});
  const name = rest[1];
  const picked = name.endsWith("*") ? Object.keys(zones).filter((z) => z.startsWith(name.slice(0, -1))) : [name];
  if (picked.length === 0 || picked.some((z) => !zones[z])) {
    console.error(`No existe la zona "${name}". Zonas: ${Object.keys(zones).join(", ")}`);
    process.exit(1);
  }
  files = [...new Set(picked.flatMap((z) => zones[z].files))];
}
if (!command || !namespace) {
  console.error("Uso: node scripts/i18n-work.mjs plan|apply <namespace> <archivo...>  |  --zone <zona>");
  process.exit(1);
}
if (command === "plan") plan(namespace, files);
else if (command === "apply") apply(namespace, files);
else {
  console.error(`Comando desconocido: ${command}`);
  process.exit(1);
}
