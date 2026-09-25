import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import { auth } from "@/lib/auth/betterAuth";

export interface GetWalletSuccessResponse {
  data: unknown;
  message: string;
  status: number;
  ok: boolean;
}

export type GetWalletResponse = GetWalletSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetWalletResponse>> {
  try {
    if (!request)
      throw new Error("No request received from get-wallet in Wallet");
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, letting ANY authenticated caller read ANOTHER user's whole
    // wallet (budget, cash, primaryCurrency, etc.) - an IDOR, same
    // underlying issue already fixed in get-user. The only real call site
    // (walletSlice.ts's fetchWallet) always sends its own session's email,
    // so deriving it server-side instead closes the hole with no change to
    // any legitimate caller's behavior.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(
        {
          error: "User not found, review the email provided in GENERAL-DATA POST",
        } as unknown as string
      );
    const walletId = userFound.wallet;

    //FIND WALLET
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Wallet.js
    const walletFound = await (
      Wallet as unknown as {
        findById: (id: unknown) => { lean: () => Promise<unknown> };
      }
    )
      .findById(walletId)
      .lean();
    // .populate({
    //     path: "budget.individualBudget.category",
    // })
    //IF ERROR
    if (!walletFound)
      throw new Error("Wallet no found, review the wallet id on GENERAL-DATA POST");
    // console.log(walletFound)

    return NextResponse.json({
      data: walletFound,
      message: "Categories and SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
