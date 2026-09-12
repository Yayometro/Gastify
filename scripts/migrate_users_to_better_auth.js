// One-time migration: for every existing User with a `password` (bcrypt
// hash), insert a matching `account` document (Better Auth's own model for
// a credential login - see src/lib/auth/betterAuth.js's comments on why
// this is a separate collection from `users`) so existing users keep
// logging in with their current password, no reset required. The
// `emailAndPassword.password.verify` override in betterAuth.js compares
// against this same bcrypt hash directly - nothing here re-hashes anything.
//
// Idempotent: skips any user that already has a `credential` account (safe
// to re-run). Writes nothing else - Google/GitHub users need no migration
// here, Better Auth links them to their existing user by verified email on
// their next login automatically (see betterAuth.js's `trustedProviders`).
//
// IMPORTANT: run scripts/backup_better_auth_migration.js FIRST.
// Usage: node --env-file=.env scripts/migrate_users_to_better_auth.js

import mongoose from "mongoose";
import User from "../src/model/User.js";

async function main() {
  const uri = process.env.DB_URI;
  if (!uri) throw new Error("DB_URI not set");
  await mongoose.connect(uri);

  const accountCollection = mongoose.connection.collection("account");
  const users = await User.find({ password: { $exists: true, $ne: "" } }).lean();

  let migrated = 0;
  let skipped = 0;
  for (const user of users) {
    const existing = await accountCollection.findOne({ userId: user._id, providerId: "credential" });
    if (existing) {
      skipped += 1;
      continue;
    }
    await accountCollection.insertOne({
      userId: user._id,
      accountId: String(user._id),
      providerId: "credential",
      password: user.password,
      createdAt: user.createdAt || new Date(),
      updatedAt: new Date(),
    });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} user(s), skipped ${skipped} already-migrated user(s), out of ${users.length} total with a password.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
