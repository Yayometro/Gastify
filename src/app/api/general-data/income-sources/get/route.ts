import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import IncomeSource from "@/model/IncomeSource";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface GetIncomeSourcesStatusResponse {
  mes: string;
}

export interface GetIncomeSourcesSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type GetIncomeSourcesResponse = GetIncomeSourcesSuccessResponse;

export async function GET(): Promise<NextResponse<GetIncomeSourcesStatusResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetIncomeSourcesResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request)
      throw new Error(t("errors.no.data.in.request.on.16"));
    // Security fix: this used to trust whatever mail the client sent in the
    // body (confusingly named `id`), letting any caller (this endpoint
    // isn't covered by middleware.ts's matcher) read another user's
    // income sources - an IDOR, same underlying issue already fixed in
    // get-user/get-wallet/get-categories/get-sub-categories/budget/get. The
    // only real call sites (WalletAnalyzer.tsx and useProjectionTable.js)
    // always send the session user's email.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(t("errors.user.not.found.review.the"));
    const userId = userFound._id;
    const walletId = userFound.wallet;

    const findIncomeSources = await IncomeSource.find({
      user: userId,
      wallet: walletId,
      archived: { $ne: true },
    }).lean();
    if (!findIncomeSources) throw new Error(t("errors.income.sources.were.not.found"));
    return NextResponse.json({
      message: t("errors.api.incomeSourcesFound"),
      data: findIncomeSources,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
