import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import { generateApiToken } from "@/lib/auth/apiTokens";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on API-TOKENS NEW POST");
    const { mail, name } = await request.json();
    if (!mail) throw new Error("No mail provided on API-TOKENS NEW POST");
    if (!name) throw new Error("A name is required to create an API token");
    await dbConnection();

    const user = await User.findOne({ mail });
    if (!user) throw new Error("User not found on API-TOKENS NEW POST");

    const { token, tokenHash } = generateApiToken();
    user.apiTokens.push({ name, tokenHash });
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
