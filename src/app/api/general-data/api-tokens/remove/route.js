import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on API-TOKENS REMOVE POST");
    const { tokenId } = await request.json();
    if (!tokenId) throw new Error("No tokenId provided on API-TOKENS REMOVE POST");
    // Security fix: this used to trust whatever `mail` the client sent in
    // the body, letting ANY authenticated caller revoke ANOTHER user's API
    // tokens (an IDOR - same underlying issue fixed in
    // get-user/update-user/list/new). The only real call site
    // (ApiTokensPanel.tsx) always sends its own session's email, so
    // deriving it server-side instead closes the hole with no change to
    // any legitimate caller's behavior.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    const mail = sesion.user.email;
    await dbConnection();

    const user = await User.findOne({ mail });
    if (!user) throw new Error("User not found on API-TOKENS REMOVE POST");

    const before = user.apiTokens.length;
    user.apiTokens = user.apiTokens.filter((t) => String(t._id) !== String(tokenId));
    if (user.apiTokens.length === before) throw new Error("Token not found for this user");
    await user.save();

    return NextResponse.json({
      message: "API token revoked successfully 🤓",
      status: 200,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
