import type { Db, MongoClient } from "mongodb";
import bcryptjs from "bcryptjs";
import { betterAuth } from "better-auth";
import { createAuthMiddleware, getSessionFromCtx, isAPIError } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { provisionNewUserData } from "./provisionNewUserData";
import { getSharedMongoClient } from "@/lib/db/mongoClient";

// Reuses the exact same MongoClient/connection pool that Mongoose's own
// dbConnection() uses (see src/lib/db/mongoClient.js), instead of opening a
// second independent one. Both used to default to up to 100 connections
// PER instance, and every cold serverless start created fresh copies of
// both - doubling the sockets Vercel opened against Atlas and driving the
// free-tier cluster to "approaching connection limit 100%" in production.
// `client.db()` stays lazy exactly as before: it queues operations until
// the shared connection is actually established, so this remains a
// synchronous top-level `auth` export with no async-singleton dance.
const client = getSharedMongoClient() as unknown as MongoClient;
const db: Db = client.db();

async function bcryptHash(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

async function bcryptVerify({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

// Endpoints whose SUCCESS is the step-up proof itself: a TOTP code, a backup
// code, a passkey sign-in, or a passkey registration (onboarding). Better Auth
// has just verified the proof inside that same request, so the freshness stamp
// is written here on the server - the client can no longer ask for it.
const STEP_UP_PROOF_PATHS = new Set([
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
  "/passkey/verify-authentication",
  "/passkey/verify-registration",
]);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db, { client }),
  // Reuses the existing `users` collection and its existing field names -
  // see the migration plan for why: every other collection's
  // `user: ObjectId ref: "User"` (Wallet, Account, Transaction, Category,
  // Budget, etc.) keeps working untouched, and every route that queries
  // `User.findOne({ mail: ... })` today needs zero changes. `phone`,
  // `wallet`, and `apiTokens` are deliberately NOT declared here - they stay
  // fields only the app's own Mongoose `User` model reads/writes, so Better
  // Auth's adapter never touches (and never down-casts) the `wallet`
  // ObjectId reference.
  user: {
    modelName: "users",
    fields: {
      email: "mail",
      name: "fullName",
    },
  },
  // `stepUpVerifiedAt` is the app's own step-up-freshness marker (see
  // dashboard/layout.tsx and IdleStepUpGuard.tsx) - never written by Better
  // Auth's own code, only by the `hooks.after` below. Declaring it here just makes
  // auth.api.getSession() return it alongside every other session field
  // automatically, instead of needing a second query everywhere it's read.
  session: {
    additionalFields: {
      stepUpVerifiedAt: { type: "date", required: false },
    },
  },
  // No `advanced.database.generateId` override, deliberately: the Mongo
  // adapter's OWN default id generator already produces a real native
  // MongoDB ObjectId for every new document's `_id` (and for every foreign
  // key referencing it, like `account.userId`) - confirmed by reading
  // @better-auth/mongo-adapter's source directly. Setting a custom
  // `generateId` function switches the adapter into a different code path
  // (`customIdGen`) that skips that ObjectId coercion entirely and stores
  // ids as plain strings instead - which would silently break every
  // `ref: "User"` / `.populate('user')` in the app for any user created
  // after this migration. Existing users keep their own already-correct
  // ObjectId `_id` regardless, untouched by any of this.
  emailAndPassword: {
    enabled: true,
    // Existing users' passwords are bcrypt hashes (via bcryptjs, same as
    // the old /api/register and general-data/user/update-user routes) -
    // overriding the default scrypt hasher with bcrypt keeps every existing
    // password working immediately, no forced resets.
    password: {
      hash: bcryptHash,
      verify: bcryptVerify,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    // GitHub dropped deliberately - GITHUB_SECRET was never configured and
    // the user confirmed they don't plan to use it.
  },
  account: {
    accountLinking: {
      // Google reports a verified email, so this only formalizes what the
      // old NextAuth `signIn` callback already trusted by hand: an existing
      // user's Google login links to their existing account instead of
      // creating a duplicate.
      trustedProviders: ["google"],
      // Better Auth's default additionally requires the LOCAL user row to
      // already have emailVerified:true before it'll trust trustedProviders
      // at all - Gastify has no email-verification flow, so no user
      // (migrated or new) ever has that flag set, which made linking fail
      // with `account_not_linked` for every real account regardless of
      // trustedProviders. Disabling this restores the old NextAuth
      // callback's actual behavior: trust Google's own `email_verified`
      // claim directly, nothing more.
      requireLocalEmailVerified: false,
    },
  },
  // Top-level hook (NOT the twoFactor plugin's own hook, which must stay at its
  // default - see the twoFactor comment below). Runs after EVERY endpoint call
  // and stamps `stepUpVerifiedAt` on the session only when one of the proof
  // endpoints above succeeded. A wrong code makes the endpoint return an
  // APIError, which is skipped, so the stamp cannot be forged from the client.
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (!STEP_UP_PROOF_PATHS.has(ctx.path)) return;
      if (isAPIError(ctx.context.returned)) return;
      // A fresh sign-in (TOTP/backup code challenge, passkey login) just
      // created its session; otherwise it is the caller's existing one.
      const sessionToken =
        ctx.context.newSession?.session.token ?? (await getSessionFromCtx(ctx))?.session.token;
      if (!sessionToken) return;
      await db.collection("session").updateOne({ token: sessionToken }, { $set: { stepUpVerifiedAt: new Date() } });
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Runs after ANY new user is created - credentials sign-up or a
        // first-time Google/GitHub login alike - replacing what used to be
        // two separately-maintained provisioning paths (the manual
        // /api/register route, and the old NextAuth signIn callback's own
        // fetch("/api/register") for OAuth).
        after: async (user) => {
          await provisionNewUserData(user);
        },
      },
    },
  },
  plugins: [
    passkey({
      rpName: "Gastify",
      authenticatorSelection: {
        // Face ID / Touch ID / Windows Hello by default - a physical
        // security key still works if the browser offers one, this just
        // doesn't make it the primary suggestion.
        authenticatorAttachment: "platform",
      },
    }),
    // Used purely as a verification toolkit here (enableTwoFactor,
    // getTOTPURI, verifyTOTP, generateBackupCodes, verifyBackupCode) -
    // TOTP + backup codes only, no OTP/SMS (see the researched cost/
    // security comparison: SMS needs a paid third-party gateway and is the
    // weakest of the three options). This plugin's own automatic sign-in
    // gating (its `hooks.after` on /sign-in/email) is left at its default,
    // stable, never-reverted behavior for password login specifically -
    // the app-level step-up gate (dashboard/layout.js + /verify-2fa) is
    // what covers Google and passkey, deliberately NOT by widening this
    // plugin's own hook onto those paths (see the plan's Context section
    // for why that specific approach broke in production upstream).
    twoFactor({
      issuer: "Gastify",
      // Lets a user who signed up via Google or passkey only (no password,
      // no `account` credential entry) still enable TOTP - otherwise the
      // `enableTwoFactor` endpoint requires a password to confirm the
      // change, which a passwordless user doesn't have.
      allowPasswordless: true,
    }),
  ],
});
