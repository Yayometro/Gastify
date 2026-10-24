import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Budget from "@/model/Budget";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import "@/model/Category";
import "@/model/SubCategory";
import { serverT } from "@/i18n/server";

export interface GetHistoricalBudgetsSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type GetHistoricalBudgetsResponse = GetHistoricalBudgetsSuccessResponse;

// Unlike /budget/get, this deliberately does NOT exclude archived budgets -
// archiving a Budget only flips a display flag, it never deletes the
// document or its history[] config log, so a historical/period-over-period
// comparative (dashboard/history) needs every budget that was ever active
// during the requested range, not just the ones still shown day-to-day.
export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetHistoricalBudgetsResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.10"));
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) read another user's historical budgets - an
    // IDOR, same underlying issue already fixed in get-user/get-wallet/
    // get-categories/get-sub-categories/budget-get. The real call sites
    // (HistoricalBudgetsComparative.jsx, HistoricalWalletAnalyzer.jsx)
    // always send their own session's email.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.budget"));
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
      message: t("errors.historical.budgets.found.successfully"),
      data: findBudgets,
      status: 200,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
