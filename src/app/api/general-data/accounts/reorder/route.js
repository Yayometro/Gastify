import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Account from "@/model/Account";
import { auth } from "@/lib/auth/betterAuth";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on ACCOUNTS REORDER POST");
    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds) || orderedIds.length === 0)
      throw new Error("No orderedIds provided on ACCOUNTS REORDER POST");
    // Security fix: this route had zero session verification - it trusted
    // whatever `mail` the client sent in the body to resolve the wallet to
    // reorder, and this endpoint (unlike dashboard pages) isn't covered by
    // middleware.ts's matcher at all, so it was reachable by ANY caller,
    // authenticated or not. The only real call site (MultiCreditCard.tsx)
    // always sends its own session's email, so deriving it server-side
    // instead closes the hole with no change to any legitimate behavior.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
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
