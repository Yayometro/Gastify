import { NextResponse, type NextRequest } from "next/server";
import Account, { type IAccount } from "@/model/Account";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";
import GoalFundingClaim from "@/model/GoalFundingClaim";

export type RemoveAccountRequestBody = string;

export interface RemoveAccountSuccessResponse {
  message: string;
  data: IAccount;
  status: number;
  ok: boolean;
}

export type RemoveAccountResponse = RemoveAccountSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<RemoveAccountResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.7"));
    const accountId = (await request.json()) as RemoveAccountRequestBody;
    // Security fix: this route had zero ownership/session check - it
    // deleted whatever Account matched accountId, no matter who owned
    // it, and this endpoint isn't covered by middleware.ts's matcher
    // (dashboard pages only), so it was reachable - and could delete any
    // account in the database - by ANY caller, authenticated or not.
    // Now deletion is scoped to an account that actually belongs to the
    // caller's own session/wallet. The only real call site
    // (EditAccountModal.jsx) always removes the caller's own account.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.remove.3"));
    // FIND ACCOUNT
    const removedAccount = await Account.findOneAndDelete({
      _id: accountId,
      wallet: userFound.wallet,
    });
    //IF ERROR
    if (!removedAccount)
      throw new Error(t("errors.api.accountNotIdentifiedRemove"));
    await GoalFundingClaim.deleteMany({ wallet: userFound.wallet, account: accountId });

    return NextResponse.json({
      message: t("errors.api.removed", { p1: removedAccount.name }),
      data: removedAccount,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
