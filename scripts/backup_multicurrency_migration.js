// Read-only export of every document in the 7 collections the multi-currency
// migration (scripts/migrate_multicurrency.js) will write to, taken
// immediately before running it. Writes nothing to MongoDB - only to local
// JSON files, so this is safe to run any time.
//
// Usage: node --env-file=.env scripts/backup_multicurrency_migration.js

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import mongoose from "mongoose";

const COLLECTIONS = [
  "wallets",
  "accounts",
  "transactions",
  "budgets",
  "incomesources",
  "projectionsettings",
  "categoryrules",
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(process.cwd(), "backups", `multicurrency-pre-migration-${stamp}`);
  await mkdir(outDir, { recursive: true });

  const counts = {};
  for (const name of COLLECTIONS) {
    const docs = await mongoose.connection.collection(name).find({}).toArray();
    const filePath = path.join(outDir, `${name}.json`);
    await writeFile(filePath, JSON.stringify(docs, null, 2));
    counts[name] = docs.length;
    console.log(`${name}: ${docs.length} documents -> ${filePath}`);
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    outDir,
    counts,
  };
  await writeFile(path.join(outDir, "_manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\nBackup complete:", outDir);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
