import dbConnection from "@/app/api/dbConnection";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

// Not exported: a Next.js route file may only export handlers. Kept as the source of the request-body type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const removeManyTransactionsSchema = z
  .object({
    manyTrans: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

export type RemoveManyTransactionsRequestBody = z.infer<
  typeof removeManyTransactionsSchema
>;

export interface RemoveManyTransactionsSuccessResponse {
  message: string;
  deletedCount: number;
  status: number;
  ok: true;
}

export interface RemoveManyTransactionsErrorResponse {
  error: string;
  status: number;
  ok: false;
}

export type RemoveManyTransactionsResponse =
  | RemoveManyTransactionsSuccessResponse
  | RemoveManyTransactionsErrorResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<RemoveManyTransactionsResponse>> {
  try {
    if (!request)
      throw new Error(
        "No request info ID send to work on REMOVE MANY TRANSACTION"
      );

    const { manyTrans } = ((await request.json()) ||
      {}) as RemoveManyTransactionsRequestBody;
    console.log(manyTrans);

    // Security fix: this route previously lacked session verification and
    // performed Transaction.deleteMany({ _id: { $in: manyTrans } }) directly with zero ownership check (IDOR).
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope the deletion query to the user's wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on REMOVE MANY TRANSACTIONS");

    const userWallet = userFound.wallet;

    // Eliminar todas las transacciones cuyos IDs estén en el array manyTrans
    const result = await Transaction.deleteMany({
      _id: { $in: manyTrans || [] },
      wallet: userWallet,
    });
    console.log(result);
    if (!result)
      throw new Error(
        "Something went wrong trying to delete multiple transactions"
      );
    return NextResponse.json({
      message: `"${result.deletedCount}" transactions removed successfully`,
      deletedCount: result.deletedCount,
      status: 200,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({
      error: (e as Error)?.message || "Unexpected error",
      status: 500,
      ok: false,
    });
  }
}
