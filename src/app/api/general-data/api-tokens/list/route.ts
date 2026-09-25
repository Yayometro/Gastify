import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

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
  try {
    if (!request) throw new Error("No data in request on API-TOKENS LIST POST");
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, letting ANY authenticated caller list ANOTHER user's API
    // tokens (an IDOR - same underlying issue fixed in get-user/update-user).
    // The only real call site (ApiTokensPanel.tsx) always sends its own
    // session's email, so deriving it server-side instead closes the hole
    // with no change to any legitimate caller's behavior.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    const mail = sesion.user.email;
    await dbConnection();

    const user = await User.findOne({ mail }).lean();
    if (!user) throw new Error("User not found on API-TOKENS LIST POST");

    // Never return tokenHash - only what's needed to identify/revoke a token.
    const tokens: ApiTokenListItem[] = (user.apiTokens || []).map((t) => ({
      _id: (t as unknown as { _id?: unknown })._id,
      name: t.name,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
    }));

    return NextResponse.json({
      message: "API tokens found",
      data: tokens,
      status: 200,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
