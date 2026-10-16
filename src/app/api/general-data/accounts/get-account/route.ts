import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Account from "@/model/Account";
import { auth } from "@/lib/auth/betterAuth";

export interface GetAccountSuccessResponse {
  data: unknown;
  message: string;
  status: number;
  ok: boolean;
}

export type GetAccountResponse = GetAccountSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetAccountResponse>> {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    // Security fix: this used to trust whatever mail the client sent in the
    // body and return that user's accounts (names, balances, institutions)
    // to anyone, signed in or not - an IDOR, same issue already fixed in the
    // sibling read routes (budget/get, get-transactions, get-wallet...). The
    // user now comes from the session; any body the client still sends
    // (accountsSlice.ts's fetchAccounts sends its own mail) is ignored.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GET-ACCOUNT POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;

    //FIND CATEGORIES
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Account.js
    const accountFounded = await (
      Account as unknown as {
        find: (filter: unknown) => {
          sort: (sortObj: unknown) => {
            lean: () => Promise<unknown>;
          };
        };
      }
    )
      .find({
        user: userId,
        wallet: walletId,
      })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    if (!accountFounded)
      throw new Error(
        "No accounts found, review the user and wallet id on GET-ACCOUNT POST"
      );
    return NextResponse.json({
      data: accountFounded,
      message: "Accoutns founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
