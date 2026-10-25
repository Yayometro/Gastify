import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User, { type IUser } from "@/model/User";
import { generateApiToken } from "@/lib/auth/apiTokens";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

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
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.19"));
    const { name } = (await request.json()) as CreateApiTokenRequestBody;
    if (!name) throw new Error(t("errors.a.name.is.required.to"));
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, letting ANY authenticated caller mint a full-access API
    // token for ANOTHER user's account (an IDOR - and the most severe of
    // this family, since the resulting token grants ongoing programmatic
    // access, same underlying issue fixed in get-user/update-user/list).
    // The only real call site (ApiTokensPanel.tsx) always sends its own
    // session's email, so deriving it server-side instead closes the hole
    // with no change to any legitimate caller's behavior.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    const mail = sesion.user.email;
    await dbConnection();

    const user = await User.findOne({ mail });
    if (!user) throw new Error(t("errors.user.not.found.on.api.2"));

    const { token, tokenHash } = generateApiToken();
    user.apiTokens.push({ name, tokenHash } as unknown as IUser["apiTokens"][number]);
    await user.save();

    return NextResponse.json({
      // The raw token is only ever returned here, at creation time - it is
      // never stored and cannot be recovered afterward.
      message: t("errors.api.token.created.copy.it"),
      data: { token, name },
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
