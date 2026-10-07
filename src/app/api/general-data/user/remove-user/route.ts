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
import Budget from "@/model/Budget";
import CategoryRule from "@/model/CategoryRule";
import IncomeSource from "@/model/IncomeSource";
import ProjectionBaseline from "@/model/ProjectionBaseline";
import ProjectionSettings from "@/model/ProjectionSettings";
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

    const userToRemove = await User.findOne({ mail });
    if (!userToRemove) throw new Error("User not removed, please verify the email");
    const userId = userToRemove._id;

    // The cascade spans many collections and cannot be one transaction, so the
    // ORDER does the work (bug 121). Step 1 only deletes plain data, and every
    // one of those deletes is safe to repeat. Nothing that lets the person get
    // back in (credentials, TOTP secret, sessions, the user document) is touched
    // until step 2. If step 1 fails halfway the account still exists, the person
    // can sign in and confirm again, and the retry simply picks up from there.
    await Wallet.deleteMany({ user: userId });
    await Account.deleteMany({ user: userId });
    await Transaction.deleteMany({ user: userId });
    await Category.deleteMany({ user: userId });
    await SubCategory.deleteMany({ user: userId });
    await Tag.deleteMany({ user: userId });
    // Every other collection that keeps data per user. These used to be left
    // behind (budgets piled up as orphans; the rest would have too the day a
    // real account with rules/income sources/projections was deleted).
    // Any NEW per-user model must be added here (the route test checks each
    // of these is cleaned).
    await Budget.deleteMany({ user: userId });
    await CategoryRule.deleteMany({ user: userId });
    await IncomeSource.deleteMany({ user: userId });
    await ProjectionBaseline.deleteMany({ user: userId });
    await ProjectionSettings.deleteMany({ user: userId });

    // Step 2: everything that gives access to the account goes in ONE
    // transaction - all of it or none of it. Better Auth's own collections
    // (created outside a Mongoose model, on purpose - see
    // src/lib/auth/betterAuth.ts) are not cleaned up by deleting the User
    // document, and their `userId` is a real Mongo ObjectId (the adapter's
    // default id generator), so it matches `userId` directly.
    const dbSession = await mongoose.startSession();
    let removedUser: IUser | null = null as IUser | null;
    try {
      await dbSession.withTransaction(async () => {
        const authCollection = (name: string) => mongoose.connection.collection(name);
        await authCollection("passkey").deleteMany({ userId }, { session: dbSession });
        await authCollection("account").deleteMany({ userId }, { session: dbSession });
        // The TOTP secret and the backup codes live in their own collection.
        await authCollection("twoFactor").deleteMany({ userId }, { session: dbSession });
        await authCollection("session").deleteMany({ userId }, { session: dbSession });
        removedUser = await User.findOneAndDelete({ _id: userId }, { session: dbSession });
      });
    } finally {
      await dbSession.endSession();
    }
    if (!removedUser) throw new Error("User not removed, please verify the email");
    const deletedUser: IUser = removedUser;
    return NextResponse.json<RemoveUserSuccessResponse>({
      data: toPublicUser(deletedUser) as PublicUser<IUser>,
      message: `${deletedUser.fullName || "Your account"} removed successfully 🤓`,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
