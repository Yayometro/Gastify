import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LEGACY_ICONS } from "./legacyIconRegistry";
import { resolveIcon } from "@/components/multiUsedComp/UniversalCategoIcon";
import { defaultIcons } from "@/helpers/defaultIconsDB";

const SRC = path.resolve(__dirname, "../..");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name) && !full.endsWith("legacyIconRegistry.ts")) out.push(full);
  }
  return out;
}

const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("legacy icon registry", () => {
  const files = sourceFiles(SRC).map((file) => ({ file, text: withoutComments(fs.readFileSync(file, "utf8")) }));

  it("every icon name written in the code resolves (run scripts/generate-icon-registry.mjs if this fails)", () => {
    const missing = new Set<string>();
    for (const { text } of files) {
      for (const m of text.matchAll(/["'`](md|fa|ai|gi)\/([A-Z][A-Za-z0-9]+)["'`]/g)) if (!LEGACY_ICONS[`${m[1]}/${m[2]}`]) missing.add(`${m[1]}/${m[2]}`);
      for (const m of text.matchAll(/["'`]((Md|Fa|Ai|Gi)[A-Z][A-Za-z0-9]+)["'`]/g)) if (!LEGACY_ICONS[`${m[2].toLowerCase()}/${m[1]}`]) missing.add(m[1]);
    }
    expect([...missing]).toEqual([]);
  });

  it("every icon of the picker resolves", () => {
    const names = defaultIcons.flatMap((group) => group.icons);
    expect(names.length).toBeGreaterThan(100);
    expect(names.filter((n) => !resolveIcon(n))).toEqual([]);
  });

  it("every icon name stored in the database resolves", () => {
    const stored = JSON.parse(fs.readFileSync(path.resolve(SRC, "../scripts/data/stored-icon-names.json"), "utf8")) as string[];
    expect(stored.length).toBeGreaterThan(50);
    expect(stored.filter((n) => !resolveIcon(n))).toEqual([]);
  });

  it("bare names infer their collection and unknown names draw nothing", () => {
    expect(resolveIcon("MdFilterNone")).toBe(LEGACY_ICONS["md/MdFilterNone"]);
    expect(resolveIcon("md/MdNoSuchIcon")).toBeNull();
    expect(resolveIcon(undefined)).toBeNull();
  });

  it("no file loads a whole react-icons package (that is what put ~8 MB of icons in every page)", () => {
    const offenders = files.filter(({ text }) => /import\s+\*\s+as\s+\w+\s+from\s+["']react-icons\//.test(text)).map(({ file }) => path.relative(SRC, file));
    expect(offenders).toEqual([]);
  });
});
