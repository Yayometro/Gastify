import Budget from "@/model/Budget";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/betterAuth";

// Unlike /budget/get, this deliberately does NOT exclude archived budgets -
// archiving a Budget only flips a display flag, it never deletes the
// document or its history[] config log, so a historical/period-over-period
// comparative (dashboard/history) needs every budget that was ever active
// during the requested range, not just the ones still shown day-to-day.
export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on BUDGET GET-HISTORICAL POST");
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) read another user's historical budgets - an
    // IDOR, same underlying issue already fixed in get-user/get-wallet/
    // get-categories/get-sub-categories/budget-get. The real call sites
    // (HistoricalBudgetsComparative.jsx, HistoricalWalletAnalyzer.jsx)
    // always send their own session's email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on BUDGET GET-HISTORICAL POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;

    const findBudgets = await Budget.find({
      user: userId,
      wallet: walletId,
    })
      .lean()
      .populate({ path: "category", strictPopulate: false })
      .populate({ path: "subCategory", strictPopulate: false })
      .populate({ path: "categories.category", strictPopulate: false })
      .populate({ path: "categories.subCategory", strictPopulate: false });

    return NextResponse.json({
      message: "Historical budgets found successfully",
      data: findBudgets,
      status: 200,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
