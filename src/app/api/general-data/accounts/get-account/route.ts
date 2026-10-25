import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Account from "@/model/Account";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

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
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.request.received.from.new"));
    // Security fix: this used to trust whatever mail the client sent in the
    // body and return that user's accounts (names, balances, institutions)
    // to anyone, signed in or not - an IDOR, same issue already fixed in the
    // sibling read routes (budget/get, get-transactions, get-wallet...). The
    // user now comes from the session; any body the client still sends
    // (accountsSlice.ts's fetchAccounts sends its own mail) is ignored.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(t("errors.user.not.found.review.the.2"));
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
        t("errors.no.accounts.found.review.the.2")
      );
    return NextResponse.json({
      data: accountFounded,
      message: t("errors.accoutns.founded"),
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
