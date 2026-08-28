import crypto from "crypto";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Wallet from "@/model/Wallet";

// Personal access tokens for third-party AI-agent connectors. A random
// 256-bit token is high-entropy already, unlike a user-chosen password -
// SHA-256 lets us look it up with a direct indexed query instead of
// comparing against every stored bcrypt hash one by one, which is why this
// deliberately doesn't reuse the app's bcryptjs password hashing.
export function generateApiToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashApiToken(token);
  return { token, tokenHash };
}

export function hashApiToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Resolves the User + Wallet a request is acting as, from its
// `Authorization: Bearer <token>` header. Throws on any failure - callers
// should catch and respond 401, never fall back to trusting a body field.
export async function getUserFromApiToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Missing or malformed Authorization header");
  }

  await dbConnection();
  const tokenHash = hashApiToken(token);
  const user = await User.findOne({ "apiTokens.tokenHash": tokenHash });
  if (!user) throw new Error("Invalid API token");

  const matchedToken = user.apiTokens.find((t) => t.tokenHash === tokenHash);
  matchedToken.lastUsedAt = new Date();
  await user.save();

  const wallet = await Wallet.findById(user.wallet).lean();
  if (!wallet) throw new Error("No wallet found for this user");

  return { user, wallet };
}
