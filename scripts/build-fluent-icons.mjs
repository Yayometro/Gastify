// Builds the Fluent Emoji 3D icon set served from /icons/fluent/ (Microsoft,
// MIT licence). Run by hand when the set should change - the output is committed:
//   node scripts/build-fluent-icons.mjs
//
// For every emoji WITHOUT skin-tone variants it downloads the 3D PNG from the
// pinned commit, converts it to a small WebP and writes public/icons/fluent/<slug>.webp,
// plus manifest.json (slug, name, glyph, group, keywords) for the icon picker.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "public/icons/fluent");
const COMMIT = "1ffb34c752ecf5d402f04cfb4b392c77f57c54bc"; // microsoft/fluentui-emoji, 2026-08-24
const SIZE = 96;
const QUALITY = 80;
const RAW = `https://raw.githubusercontent.com/microsoft/fluentui-emoji/${COMMIT}`;
const TONES = /\/(Default|Light|Medium-Light|Medium|Medium-Dark|Dark)\/3D\//;

const slugOf = (dir) =>
  dir
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’.,:()!]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}
async function getBuffer(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (attempt === 3) throw new Error(`${res.status} ${url}`);
    await new Promise((r) => setTimeout(r, 400 * attempt));
  }
}
async function pool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    })
  );
  return results;
}

const tree = await getJson(`https://api.github.com/repos/microsoft/fluentui-emoji/git/trees/${COMMIT}?recursive=1`);
if (tree.truncated) throw new Error("GitHub truncated the tree");
const pngs = tree.tree.filter((t) => t.type === "blob" && t.path.startsWith("assets/") && t.path.endsWith("_3d.png") && !TONES.test(t.path));
console.log(`${pngs.length} emojis without skin tones`);

fs.mkdirSync(OUT, { recursive: true });
const seen = new Map();
const entries = pngs.map((t) => {
  const dir = t.path.split("/")[1];
  const slug = slugOf(dir);
  if (seen.has(slug)) throw new Error(`slug collision: ${slug} (${dir} vs ${seen.get(slug)})`);
  seen.set(slug, dir);
  return { dir, slug, png: t.path };
});

let done = 0;
const manifest = await pool(entries, 8, async ({ dir, slug, png }) => {
  const [image, meta] = await Promise.all([
    getBuffer(`${RAW}/${png.split("/").map(encodeURIComponent).join("/")}`),
    getJson(`${RAW}/assets/${encodeURIComponent(dir)}/metadata.json`).catch(() => ({})),
  ]);
  const webp = await sharp(image).resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: QUALITY, effort: 6 }).toBuffer();
  fs.writeFileSync(path.join(OUT, `${slug}.webp`), webp);
  if (++done % 200 === 0) console.log(`  ${done}/${entries.length}`);
  return { slug, name: meta.cldr || dir.toLowerCase(), glyph: meta.glyph || "", group: meta.group || "Other", keywords: meta.keywords || [] };
});

manifest.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ commit: COMMIT, size: SIZE, icons: manifest }));
const license = await getBuffer(`${RAW}/LICENSE`);
fs.writeFileSync(path.join(OUT, "LICENSE.txt"), license);
fs.writeFileSync(path.join(OUT, "README.txt"), `Fluent Emoji 3D by Microsoft (MIT licence, see LICENSE.txt).\nSource: https://github.com/microsoft/fluentui-emoji @ ${COMMIT}\nConverted to ${SIZE}px WebP by scripts/build-fluent-icons.mjs - do not edit by hand.\n`);

const bytes = manifest.reduce((sum, m) => sum + fs.statSync(path.join(OUT, `${m.slug}.webp`)).size, 0);
const groups = manifest.reduce((acc, m) => ((acc[m.group] = (acc[m.group] || 0) + 1), acc), {});
console.log(`done: ${manifest.length} icons, ${(bytes / 1024 / 1024).toFixed(2)} MB total, avg ${(bytes / manifest.length / 1024).toFixed(1)} KB`);
console.log(groups);
