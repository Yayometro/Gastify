import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on API-TOKENS REMOVE POST");
    const { mail, tokenId } = await request.json();
    if (!mail) throw new Error("No mail provided on API-TOKENS REMOVE POST");
    if (!tokenId) throw new Error("No tokenId provided on API-TOKENS REMOVE POST");
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
