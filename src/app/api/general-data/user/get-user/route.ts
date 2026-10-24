import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "../../../dbConnection";
import User, { type IUser } from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { toPublicUser, type PublicUser } from "@/lib/auth/publicUser";
import { serverT } from "@/i18n/server";

export interface GetUserSuccessResponse {
  message: string;
  data: PublicUser<IUser> | Record<string, unknown>;
  status: number;
  ok: boolean;
}

export type GetUserResponse = GetUserSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetUserResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on"));
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, returning ANY user's profile to ANY authenticated caller
    // (an IDOR - nothing verified the requested email belonged to the
    // caller's own session). Every real call site (grepped across the
    // repo) already only ever asks for its own session's email, so
    // deriving it server-side from the authenticated session instead of
    // trusting the request body closes the hole with no change to any
    // legitimate caller's behavior.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    const mail = sesion.user.email;
    //
    await dbConnection();
    const userFounded = await User.findOne({ mail }).lean();
    if (!userFounded)
      throw new Error(t("errors.user.not.found.review.the"));
    return NextResponse.json({
      message: t("errors.api.userFound"),
      data: toPublicUser(userFounded),
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
