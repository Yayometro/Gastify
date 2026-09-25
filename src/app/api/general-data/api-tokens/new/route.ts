import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User, { type IUser } from "@/model/User";
import { generateApiToken } from "@/lib/auth/apiTokens";
import { auth } from "@/lib/auth/betterAuth";

export interface CreateApiTokenRequestBody {
  name: string;
  mail?: string;
  [key: string]: unknown;
}

export interface CreatedApiTokenData {
  token: string;
  name: string;
}

export interface CreateApiTokenSuccessResponse {
  message: string;
  data: CreatedApiTokenData;
  status: number;
  ok: boolean;
}

export type CreateApiTokenResponse = CreateApiTokenSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<CreateApiTokenResponse>> {
  try {
    if (!request) throw new Error("No data in request on API-TOKENS NEW POST");
    const { name } = (await request.json()) as CreateApiTokenRequestBody;
    if (!name) throw new Error("A name is required to create an API token");
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, letting ANY authenticated caller mint a full-access API
    // token for ANOTHER user's account (an IDOR - and the most severe of
    // this family, since the resulting token grants ongoing programmatic
    // access, same underlying issue fixed in get-user/update-user/list).
    // The only real call site (ApiTokensPanel.tsx) always sends its own
    // session's email, so deriving it server-side instead closes the hole
    // with no change to any legitimate caller's behavior.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    const mail = sesion.user.email;
    await dbConnection();

    const user = await User.findOne({ mail });
    if (!user) throw new Error("User not found on API-TOKENS NEW POST");

    const { token, tokenHash } = generateApiToken();
    user.apiTokens.push({ name, tokenHash } as unknown as IUser["apiTokens"][number]);
    await user.save();

    return NextResponse.json({
      // The raw token is only ever returned here, at creation time - it is
      // never stored and cannot be recovered afterward.
      message: "API token created - copy it now, it won't be shown again 🤓",
      data: { token, name },
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
