import mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";

// Better Auth's own TOTP check only counts failed attempts during a sign-in
// challenge; when the code is verified for an ALREADY signed-in session (which
// is exactly the "delete my account" case) it does no attempt limiting at
// all. A stolen session could otherwise guess 6-digit codes on this
// destructive route, so failed attempts are counted here, on the caller's own
// session document (same native-driver pattern as markStepUpVerified.ts).
export const MAX_DELETE_ACCOUNT_FAILURES = 5;
export const DELETE_ACCOUNT_LOCK_MS = 15 * 60 * 1000;

interface SessionGuardDoc {
  deleteAccountFailedAttempts?: number;
  deleteAccountLockedUntil?: Date | null;
}

function sessionCollection() {
  return mongoose.connection.collection("session");
}

// Milliseconds the session is still locked out for, or 0 when it is free to try.
export async function getDeleteAccountLockRemainingMs(sessionToken: string): Promise<number> {
  await dbConnection();
  const doc = (await sessionCollection().findOne({ token: sessionToken })) as SessionGuardDoc | null;
  const lockedUntil = doc?.deleteAccountLockedUntil ? new Date(doc.deleteAccountLockedUntil).getTime() : 0;
  return Math.max(0, lockedUntil - Date.now());
}

// Records one wrong code. Returns how many tries are left before the lock starts.
export async function recordDeleteAccountFailure(
  sessionToken: string
): Promise<{ locked: boolean; attemptsLeft: number }> {
  await dbConnection();
  await sessionCollection().updateOne({ token: sessionToken }, { $inc: { deleteAccountFailedAttempts: 1 } });
  const doc = (await sessionCollection().findOne({ token: sessionToken })) as SessionGuardDoc | null;
  const failures = doc?.deleteAccountFailedAttempts || 0;
  if (failures >= MAX_DELETE_ACCOUNT_FAILURES) {
    await sessionCollection().updateOne(
      { token: sessionToken },
      {
        $set: {
          deleteAccountLockedUntil: new Date(Date.now() + DELETE_ACCOUNT_LOCK_MS),
          deleteAccountFailedAttempts: 0,
        },
      }
    );
    return { locked: true, attemptsLeft: 0 };
  }
  return { locked: false, attemptsLeft: MAX_DELETE_ACCOUNT_FAILURES - failures };
}
