import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on API-TOKENS LIST POST");
    const mail = await request.json();
    if (!mail) throw new Error("No mail provided on API-TOKENS LIST POST");
    await dbConnection();

    const user = await User.findOne({ mail }).lean();
    if (!user) throw new Error("User not found on API-TOKENS LIST POST");

    // Never return tokenHash - only what's needed to identify/revoke a token.
    const tokens = (user.apiTokens || []).map((t) => ({
      _id: t._id,
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
