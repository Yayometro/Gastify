import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { isAPIError } from "better-auth/api";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";
import { auth } from "@/lib/auth/betterAuth";
import { toPublicUser, type PublicUser } from "@/lib/auth/publicUser";
import {
  getDeleteAccountLockRemainingMs,
  recordDeleteAccountFailure,
} from "@/lib/auth/deleteAccountGuard";
import type { IUser } from "@/model/User";

export interface RemoveUserRequestBody {
  // The 6-digit code from the authenticator app, or a backup code when
  // `method` is "backup".
  code?: string;
  method?: "totp" | "backup";
  // The account email typed again by the user, as a deliberate confirmation.
  confirmMail?: string;
}

export interface RemoveUserSuccessResponse {
  data: PublicUser<IUser>;
  message: string;
  status: number;
  ok: true;
}

export interface RemoveUserErrorResponse {
  ok: false;
  message: string;
  status: number;
  attemptsLeft?: number;
  retryAfterMinutes?: number;
}

export type RemoveUserResponse = RemoveUserSuccessResponse | RemoveUserErrorResponse;

function fail(status: number, message: string, extra: Partial<RemoveUserErrorResponse> = {}) {
  return NextResponse.json<RemoveUserErrorResponse>({ ok: false, message, status, ...extra }, { status });
}

// Better Auth's own endpoints check the code against the session user's
// stored secret. A wrong code makes them throw an APIError (not a crash), which
// is just "not verified" here; anything else is a real error and propagates.
async function verifySecondFactor(
  request: NextRequest | Request,
  method: "totp" | "backup",
  code: string
): Promise<boolean> {
  try {
    if (method === "backup") {
      await auth.api.verifyBackupCode({ body: { code, disableSession: true }, headers: request.headers });
    } else {
      await auth.api.verifyTOTP({ body: { code }, headers: request.headers });
    }
    return true;
  } catch (e) {
    if (isAPIError(e)) return false;
    throw e;
  }
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<RemoveUserResponse>> {
  try {
    if (!request) throw new Error("No data in request on REMOVE USER");

    // Identity always comes from the session, never from the body (fix #43).
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) return fail(401, "No hay una sesión activa.");
    const mail = sesion.user.email;
    const sessionToken = sesion.session.token;

    const body = ((await request.json()) || {}) as RemoveUserRequestBody;
    const method = body.method === "backup" ? "backup" : "totp";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    // Deleting an account is irreversible: it needs a FRESH second-factor
    // proof inside this very request (the server verifies the code itself),
    // not a stamp left over from an earlier step-up, and the user must retype
    // the account email as a deliberate confirmation.
    if (!(sesion.user as { twoFactorEnabled?: boolean }).twoFactorEnabled) {
      return fail(
        403,
        "Para eliminar tu cuenta primero activa una app autenticadora (TOTP) en tu perfil."
      );
    }
    if (!code) return fail(400, "Escribe el código de tu app autenticadora (o un código de respaldo).");
    if ((body.confirmMail || "").trim().toLowerCase() !== mail.toLowerCase()) {
      return fail(400, "El correo escrito no coincide con el de tu cuenta.");
    }

    await dbConnection();

    const lockedMs = await getDeleteAccountLockRemainingMs(sessionToken);
    if (lockedMs > 0) {
      return fail(429, "Demasiados intentos fallidos. Intenta de nuevo más tarde.", {
        retryAfterMinutes: Math.ceil(lockedMs / 60000),
      });
    }

    const verified = await verifySecondFactor(request, method, code);
    if (!verified) {
      const { locked, attemptsLeft } = await recordDeleteAccountFailure(sessionToken);
      if (locked) {
        return fail(429, "Demasiados intentos fallidos. Intenta de nuevo en unos minutos.", {
          retryAfterMinutes: 15,
        });
      }
      return fail(401, "Código incorrecto.", { attemptsLeft });
    }

    const removedUser = await User.findOneAndDelete({ mail });
    if (!removedUser)
      throw new Error(`User not removed, please verify the email`);
    const removeWalletAssociated = await Wallet.findOneAndDelete({
      user: removedUser._id,
    });
    if (!removeWalletAssociated)
      throw new Error(`Wallet not removed, please verify the email`);
    const removedAccount = await Account.deleteMany({ user: removedUser._id });
    if (!removedAccount)
      throw new Error("Accounts not removed, please verify the email");
    const removeTransactions = await Transaction.deleteMany({
      user: removedUser._id,
    });
    if (!removeTransactions)
      throw new Error("Transactions not removed, please verify the email");
    const removeCategories = await Category.deleteMany({
      user: removedUser._id,
    });
    if (!removeCategories)
      throw new Error("Category not removed, please verify the email");
    const removeSubCategories = await SubCategory.deleteMany({
      user: removedUser._id,
    });
    if (!removeSubCategories)
      throw new Error("SubCategories not removed, please verify the email");
    const removeTags = await Tag.deleteMany({ user: removedUser._id });
    if (!removeTags)
      throw new Error("Tags not removed, please verify the email");
    // Better Auth's own collections (created outside a Mongoose model,
    // on purpose - see src/lib/auth/betterAuth.js) aren't cleaned up by
    // deleting the User document itself. `userId` on each of these is a
    // real Mongo ObjectId (the adapter's default id generator, not a
    // string - see betterAuth.js's own comment on why no custom
    // generateId is set), so a direct match against removedUser._id
    // works without any string conversion.
    await mongoose.connection.collection("account").deleteMany({ userId: removedUser._id });
    await mongoose.connection.collection("session").deleteMany({ userId: removedUser._id });
    await mongoose.connection.collection("passkey").deleteMany({ userId: removedUser._id });
    // The TOTP secret and the backup codes live in their own collection.
    await mongoose.connection.collection("twoFactor").deleteMany({ userId: removedUser._id });
    //
    return NextResponse.json<RemoveUserSuccessResponse>({
      data: toPublicUser(removedUser) as PublicUser<IUser>,
      message: `${removedUser.fullName || "Your account"} removed successfully 🤓`,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
