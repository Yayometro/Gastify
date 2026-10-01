import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "../../../dbConnection";
import User, { type IUser } from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { toPublicUser, type PublicUser } from "@/lib/auth/publicUser";

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
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, returning ANY user's profile to ANY authenticated caller
    // (an IDOR - nothing verified the requested email belonged to the
    // caller's own session). Every real call site (grepped across the
    // repo) already only ever asks for its own session's email, so
    // deriving it server-side from the authenticated session instead of
    // trusting the request body closes the hole with no change to any
    // legitimate caller's behavior.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    const mail = sesion.user.email;
    //
    await dbConnection();
    const userFounded = await User.findOne({ mail }).lean();
    if (!userFounded)
      throw new Error(
        {
          error:
            "User not found, review the email provided in GENERAL-DATA POST",
        } as unknown as string
      );
    return NextResponse.json({
      message: `User founded`,
      data: toPublicUser(userFounded),
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
