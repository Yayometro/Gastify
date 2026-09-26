import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export const removeTransferSchema = z
  .object({
    transferGroupId: z.string().optional().nullable(),
  })
  .passthrough();

export type RemoveTransferRequestBody = z.infer<typeof removeTransferSchema>;

export interface RemoveTransferSuccessResponse {
  message: string;
  data: {
    transferGroupId: string;
    deletedIds: unknown[];
  };
  status: number;
  ok: true;
}

export interface RemoveTransferErrorResponse {
  ok: false;
  message: string;
}

export type RemoveTransferResponse =
  | RemoveTransferSuccessResponse
  | RemoveTransferErrorResponse;

// Removes both legs of a transfer/exchange together - a lone orphaned leg
// would misrepresent the Account it was left in as a real gain/loss. POST
// rather than an HTTP DELETE verb, matching every other write route in
// this app (see remove-transaction, remove-many).
export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<RemoveTransferResponse>> {
  try {
    if (!request) throw new Error("No data in request on TRANSFER REMOVE POST");
    const body = ((await request.json()) || {}) as RemoveTransferRequestBody;
    const { transferGroupId } = body;
    if (!transferGroupId)
      throw new Error("transferGroupId is required to remove a transfer/exchange");

    // Security fix: this route previously lacked session verification and
    // performed Transaction.find/deleteMany({ transferGroupId }) directly with zero ownership check (IDOR).
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope the search and deletion query
    // to the user's wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on TRANSFER REMOVE");

    const legs = await Transaction.find({
      transferGroupId,
      wallet: userFound.wallet,
    }).lean();
    if (legs.length === 0)
      throw new Error("No transfer/exchange found for this transferGroupId");

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Transaction.deleteMany(
          { transferGroupId, wallet: userFound.wallet },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      message: `${legs.length} linked transaction(s) removed`,
      data: { transferGroupId, deletedIds: legs.map((l) => l._id) },
      status: 200,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { ok: false, message: (e as Error)?.message || "Unexpected error" },
      { status: 400 }
    );
  }
}
