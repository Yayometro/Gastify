// Read-only export of the `users` collection - the only pre-existing
// collection the Better Auth migration (scripts/migrate_users_to_better_auth.js)
// writes into (it inserts into brand-new `account`/`session`/`passkey`/
// `verification` collections, nothing to back up there). Taken immediately
// before running that migration. Writes nothing to MongoDB - only to local
// JSON files, so this is safe to run any time. Same pattern as
// scripts/backup_multicurrency_migration.js.
//
// Usage: node --env-file=.env scripts/backup_better_auth_migration.js

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import mongoose from "mongoose";

const COLLECTIONS = ["users"];

async function main() {
  const uri = process.env.DB_URI;
  if (!uri) throw new Error("DB_URI not set");
  await mongoose.connect(uri);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(process.cwd(), "backups", `better-auth-pre-migration-${stamp}`);
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
