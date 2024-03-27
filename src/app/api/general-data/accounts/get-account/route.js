import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Account from "@/model/Account";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const userMail = await request.json();
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: userMail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GET-ACCOUNT POST",
      });
    const userId = userFound._id;
    const walletId = userFound.wallet;

    //FIND CATEGORIES
    const accountFounded = await Account.find({
      user: userId,
      wallet: walletId,
    }).lean();
    if (!accountFounded)
      throw new Error(
        "No accounts found, review the user and wallet id on GET-ACCOUNT POST"
      );
    return NextResponse.json({
      data: accountFounded,
      message: "Accoutns founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
