import mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";

// Marks the current session as having passed the step-up check (passkey
// ceremony, TOTP code, or backup code) just now. Writes directly to Better
// Auth's own `session` collection via the native driver - same pattern
// already used for cleanup in general-data/user/remove-user/route.js -
// rather than any Better Auth API, since this has nothing to do with the
// sign-in response machinery (the session already exists and is valid;
// this only records a freshness timestamp on it).
export async function markStepUpVerified(sessionToken) {
  await dbConnection();
  await mongoose.connection
    .collection("session")
    .updateOne({ token: sessionToken }, { $set: { stepUpVerifiedAt: new Date() } });
}
