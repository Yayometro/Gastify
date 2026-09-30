import crypto from "crypto";
import type { NextRequest } from "next/server";
import type mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";
import User, { type IUser } from "@/model/User";
import Wallet from "@/model/Wallet";

export interface GeneratedApiToken {
  token: string;
  tokenHash: string;
}

export interface ApiTokenWalletBudget {
  totalBudget?: number;
  totalSavings?: number;
  isSurpassed?: boolean;
  isSaved?: boolean;
}

export interface ApiTokenWallet {
  _id: string | mongoose.Types.ObjectId;
  name?: string;
  cash?: number;
  user: string | mongoose.Types.ObjectId;
  budget?: ApiTokenWalletBudget;
  primaryCurrency?: string;
  currencyUpdatedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ResolvedApiTokenAuth {
  user: IUser;
  wallet: ApiTokenWallet;
}

interface WalletModelBridge {
  findById: (id: unknown) => {
    lean: () => Promise<ApiTokenWallet | null>;
  };
}

// Personal access tokens for third-party AI-agent connectors. A random
// 256-bit token is high-entropy already, unlike a user-chosen password -
// SHA-256 lets us look it up with a direct indexed query instead of
// comparing against every stored bcrypt hash one by one, which is why this
// deliberately doesn't reuse the app's bcryptjs password hashing.
export function generateApiToken(): GeneratedApiToken {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashApiToken(token);
  return { token, tokenHash };
}

export function hashApiToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Resolves the User + Wallet a raw token is acting as. This is the single
// source of truth for verifying a personal access token, shared by every
// connector entry point (Claude's Authorization-header route, ChatGPT's
// URL-embedded-token route, and whatever comes next) regardless of where
// each one extracts the raw token from. Throws on any failure - callers
// should catch and respond 401, never fall back to trusting a body field.
export async function resolveApiToken(token: string): Promise<ResolvedApiTokenAuth> {
  if (!token) throw new Error("Missing API token");

  await dbConnection();
  const tokenHash = hashApiToken(token);
  const user = await User.findOne({ "apiTokens.tokenHash": tokenHash });
  if (!user) throw new Error("Invalid API token");

  const matchedToken = user.apiTokens.find((t) => t.tokenHash === tokenHash);
  matchedToken.lastUsedAt = new Date();
  await user.save();

  const wallet = await (Wallet as unknown as WalletModelBridge)
    .findById(user.wallet)
    .lean();
  if (!wallet) throw new Error("No wallet found for this user");

  return { user, wallet };
}

// Claude (and any header-based connector): reads `Authorization: Bearer
// <token>` off the request, then resolves it via resolveApiToken.
export async function getUserFromApiToken(
  request: Request | NextRequest
): Promise<ResolvedApiTokenAuth> {
  const authHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Missing or malformed Authorization header");
  }
  return resolveApiToken(token);
}
