import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface ApiTokenListItem {
  _id?: unknown;
  name: string;
  createdAt: Date | string | number;
  lastUsedAt: Date | string | number | null;
}

export interface ApiTokensListSuccessResponse {
  message: string;
  data: ApiTokenListItem[];
  status: number;
  ok: boolean;
}

export type ApiTokensListResponse = ApiTokensListSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<ApiTokensListResponse>> {
  const tr = await serverT(["errors"]);
  try {
    if (!request) throw new Error(tr("errors.no.data.in.request.on.20"));
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, letting ANY authenticated caller list ANOTHER user's API
    // tokens (an IDOR - same underlying issue fixed in get-user/update-user).
    // The only real call site (ApiTokensPanel.tsx) always sends its own
    // session's email, so deriving it server-side instead closes the hole
    // with no change to any legitimate caller's behavior.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(tr("errors.no.session"));
    const mail = sesion.user.email;
    await dbConnection();

    const user = await User.findOne({ mail }).lean();
    if (!user) throw new Error(tr("errors.user.not.found.on.api.3"));

    // Never return tokenHash - only what's needed to identify/revoke a token.
    const tokens: ApiTokenListItem[] = (user.apiTokens || []).map((t) => ({
      _id: (t as unknown as { _id?: unknown })._id,
      name: t.name,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
    }));

    return NextResponse.json({
      message: tr("errors.api.tokens.found"),
      data: tokens,
      status: 200,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
