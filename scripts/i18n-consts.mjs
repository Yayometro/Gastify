#!/usr/bin/env node
// Module-level constants that hold text ("const OPTIONS = [{ label: 'Gasto' }]") cannot call the translator: the translator
// belongs to a render. This turns each such constant into a function of the translator, `const OPTIONS = (t) => [...]`,
// replaces its texts with t("key"), and updates every use to OPTIONS(t). A component that now needs `t` gets the hook.
//
//   node scripts/i18n-consts.mjs <namespace> <file...>      (the keys come from .mds/i18n-work/<namespace>.todo.json)

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, ".mds", "i18n-work");
const [namespace, ...files] = process.argv.slice(2);
if (!namespace || files.length === 0) {
  console.error("Uso: node scripts/i18n-consts.mjs <namespace> <archivo...>");
  process.exit(1);
}

const todo = JSON.parse(readFileSync(path.join(WORK, `${namespace}.todo.json`), "utf8"));
const keyOf = new Map(todo.entries.map((entry) => [entry.source, entry.key]));

const IMPORT_HOOK = 'import { useT } from "@/i18n/client";';
const IMPORT_TYPE = 'import type { TranslateFn } from "@gastify/core/i18n/translate";';

function componentName(node) {
  if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) return node.name.text;
  if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) && /^[A-Z]/.test(node.parent.name.text)) {
    return node.parent.name.text;
  }
  return null;
}

function enclosingComponent(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (componentName(p) && ts.isBlock(p.body ?? ts.factory.createBlock([]))) return p;
  }
  return null;
}

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const text = readFileSync(abs, "utf8");
  const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  // 1) the top-level constants that hold a known text
  const converted = new Map();
  const edits = [];
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!decl.initializer || !ts.isIdentifier(decl.name)) continue;
      if (decl.initializer.kind === ts.SyntaxKind.ArrowFunction || decl.initializer.kind === ts.SyntaxKind.FunctionExpression) continue;
      const literals = [];
      const collect = (node) => {
        if (ts.isStringLiteral(node) && keyOf.has(node.text)) literals.push(node);
        ts.forEachChild(node, collect);
      };
      collect(decl.initializer);
      if (literals.length === 0) continue;
      converted.set(decl.name.text, { decl, statement, literals });
    }
  }
  if (converted.size === 0) continue;

  for (const [name, { decl, literals }] of converted) {
    // every text of the initializer becomes t("key")
    for (const literal of literals) edits.push({ start: literal.getStart(sf), end: literal.getEnd(), text: `t("${keyOf.get(literal.text)}")` });
    // the constant becomes a function of the translator
    const typeNode = decl.type ? decl.type.getText(sf) : null;
    const head = `(t: TranslateFn)${typeNode ? `: ${typeNode}` : ""} => (`;
    edits.push({ start: decl.initializer.getStart(sf), end: decl.initializer.getEnd(), text: `${head}${text.slice(decl.initializer.getStart(sf), decl.initializer.getEnd())}` });
    if (decl.type) edits.push({ start: decl.type.getStart(sf) - 2, end: decl.type.getEnd(), text: "" });
    // the wrapped initializer keeps its own text edits: apply them inside the head/tail below
    void name;
  }

  // 2) the uses of each converted constant become NAME(t)
  const useEdits = [];
  const names = new Set(converted.keys());
  const visit = (node) => {
    if (ts.isIdentifier(node) && names.has(node.text)) {
      const parent = node.parent;
      const isDeclName = parent && ts.isVariableDeclaration(parent) && parent.name === node;
      const isProp = parent && ((ts.isPropertyAccessExpression(parent) && parent.name === node) || (ts.isPropertyAssignment(parent) && parent.name === node));
      if (!isDeclName && !isProp) {
        useEdits.push({ start: node.getStart(sf), end: node.getEnd(), text: `${node.text}(t)`, node });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // Build the new text by applying all edits from the end, rebuilding the wrapped initializers from the original text.
  // Simplest correct route: rebuild each converted declaration from its original text with its literals replaced.
  let out = text;
  const allEdits = [];
  for (const [name, { decl, literals }] of converted) {
    const start = decl.getStart(sf);
    const end = decl.getEnd();
    const original = text.slice(start, end);
    const init0 = decl.initializer.getStart(sf);
    const init1 = decl.initializer.getEnd();
    // the initializer with its texts replaced, from the original text
    let body = "";
    let cursor = init0;
    for (const literal of [...literals].sort((a, b) => a.getStart(sf) - b.getStart(sf))) {
      body += text.slice(cursor, literal.getStart(sf)) + `t("${keyOf.get(literal.text)}")`;
      cursor = literal.getEnd();
    }
    body += text.slice(cursor, init1);
    const typeNode = decl.type ? decl.type.getText(sf) : null;
    const declHead = text.slice(start, decl.name.getEnd());
    const declText = `const ${name} = (t: TranslateFn)${typeNode ? `: ${typeNode}` : ""} => (${body});`;
    void declHead;
    void original;
    // the statement's own text ends with ";" (kept) - replace the declaration only
    allEdits.push({ start, end, text: declText.replace(/;$/, "") });
  }
  // the uses (outside the declarations)
  for (const use of useEdits) {
    const inside = [...converted.values()].some(({ decl }) => use.start >= decl.getStart(sf) && use.end <= decl.getEnd());
    if (!inside) allEdits.push({ start: use.start, end: use.end, text: use.text });
  }
  allEdits.sort((a, b) => b.start - a.start);
  for (const edit of allEdits) out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);

  // 3) the imports, and the translator in every component that uses a converted constant
  const reparsed = ts.createSourceFile(abs, out, ts.ScriptTarget.Latest, true, abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const needComponents = new Map();
  const visit2 = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && names.has(node.expression.text) && node.arguments.length === 1 && node.arguments[0].getText(reparsed) === "t") {
      const component = enclosingComponent(node);
      if (component && !component.body.getText(reparsed).includes("const t = useT()")) needComponents.set(component.pos, component);
    }
    ts.forEachChild(node, visit2);
  };
  visit2(reparsed);
  const inserts = [];
  for (const component of needComponents.values()) {
    const first = component.body.statements[0];
    const indent = first ? " ".repeat(reparsed.getLineAndCharacterOfPosition(first.getStart(reparsed)).character) : "  ";
    inserts.push({ at: component.body.getStart(reparsed) + 1, text: `\n${indent}const t = useT();` });
  }
  inserts.sort((a, b) => b.at - a.at);
  for (const insert of inserts) out = out.slice(0, insert.at) + insert.text + out.slice(insert.at);

  const check = ts.createSourceFile(abs, out, ts.ScriptTarget.Latest, true, abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const importsNow = check.statements.filter((s) => ts.isImportDeclaration(s));
  const anchor = importsNow.length > 0 ? importsNow[importsNow.length - 1].getEnd() : 0;
  const addImports = [];
  if (!out.includes(IMPORT_TYPE)) addImports.push(IMPORT_TYPE);
  if (needComponents.size > 0 && !out.includes(IMPORT_HOOK)) addImports.push(IMPORT_HOOK);
  if (addImports.length > 0) out = out.slice(0, anchor) + "\n" + addImports.join("\n") + out.slice(anchor);

  writeFileSync(abs, out, "utf8");
  console.log(`  ${rel}: ${converted.size} constantes con texto (${[...converted.keys()].join(", ")})`);
}
