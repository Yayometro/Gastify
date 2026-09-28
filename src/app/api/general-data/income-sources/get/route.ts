import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import IncomeSource from "@/model/IncomeSource";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

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
  try {
    if (!request)
      throw new Error("No data in request on GET INCOME SOURCE POST");
    // Security fix: this used to trust whatever mail the client sent in the
    // body (confusingly named `id`), letting any caller (this endpoint
    // isn't covered by middleware.ts's matcher) read another user's
    // income sources - an IDOR, same underlying issue already fixed in
    // get-user/get-wallet/get-categories/get-sub-categories/budget/get. The
    // only real call sites (WalletAnalyzer.tsx and useProjectionTable.js)
    // always send the session user's email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(
        {
          error: "User not found, review the email provided in GENERAL-DATA POST",
        } as unknown as string
      );
    const userId = userFound._id;
    const walletId = userFound.wallet;

    const findIncomeSources = await IncomeSource.find({
      user: userId,
      wallet: walletId,
      archived: { $ne: true },
    }).lean();
    if (!findIncomeSources) throw new Error("Income Sources were not found 🤕");
    return NextResponse.json({
      message: `Income Sources were found successfully 🤓`,
      data: findIncomeSources,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
