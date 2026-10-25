import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Account from "@/model/Account";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface ReorderAccountsRequestBody {
  orderedIds?: string[];
  mail?: string;
  [key: string]: unknown;
}

export interface ReorderAccountsSuccessResponse {
  message: string;
  status: number;
  ok: boolean;
}

export type ReorderAccountsResponse = ReorderAccountsSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<ReorderAccountsResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.8"));
    const { orderedIds } = (await request.json()) as ReorderAccountsRequestBody;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0)
      throw new Error(t("errors.no.orderedids.provided.on.accounts"));
    // Security fix: this route had zero session verification - it trusted
    // whatever `mail` the client sent in the body to resolve the wallet to
    // reorder, and this endpoint (unlike dashboard pages) isn't covered by
    // middleware.ts's matcher at all, so it was reachable by ANY caller,
    // authenticated or not. The only real call site (MultiCreditCard.tsx)
    // always sends its own session's email, so deriving it server-side
    // instead closes the hole with no change to any legitimate behavior.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.accounts"));
    const walletId = userFound.wallet;

    // Scoped to this user's own wallet - a client can only ever reorder its
    // own accounts, never someone else's, regardless of what ids are sent.
    await Promise.all(
      orderedIds.map((id, index) =>
        Account.updateOne({ _id: id, wallet: walletId }, { $set: { order: index } })
      )
    );

    return NextResponse.json({
      message: t("errors.accounts.reordered.successfully"),
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
