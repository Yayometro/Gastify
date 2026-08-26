import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Account from "@/model/Account";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on ACCOUNTS REORDER POST");
    const { mail, orderedIds } = await request.json();
    if (!mail) throw new Error("No mail provided on ACCOUNTS REORDER POST");
    if (!Array.isArray(orderedIds) || orderedIds.length === 0)
      throw new Error("No orderedIds provided on ACCOUNTS REORDER POST");
    await dbConnection();

    const userFound = await User.findOne({ mail }).lean();
    if (!userFound) throw new Error("User not found on ACCOUNTS REORDER POST");
    const walletId = userFound.wallet;

    // Scoped to this user's own wallet - a client can only ever reorder its
    // own accounts, never someone else's, regardless of what ids are sent.
    await Promise.all(
      orderedIds.map((id, index) =>
        Account.updateOne({ _id: id, wallet: walletId }, { $set: { order: index } })
      )
    );

    return NextResponse.json({
      message: "Accounts reordered successfully 🤓",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
