import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";

// Removes both legs of a transfer/exchange together - a lone orphaned leg
// would misrepresent the Account it was left in as a real gain/loss. POST
// rather than an HTTP DELETE verb, matching every other write route in
// this app (see remove-transaction, remove-many).
export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on TRANSFER REMOVE POST");
    const { transferGroupId } = await request.json();
    if (!transferGroupId) throw new Error("transferGroupId is required to remove a transfer/exchange");

    await dbConnection();

    const legs = await Transaction.find({ transferGroupId }).lean();
    if (legs.length === 0) throw new Error("No transfer/exchange found for this transferGroupId");

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Transaction.deleteMany({ transferGroupId }, { session });
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
    return NextResponse.json({ ok: false, message: e?.message || "Unexpected error" }, { status: 400 });
  }
}
