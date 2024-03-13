import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Wallet from "@/model/Wallet";

export async function POST(request) {
  try {
    if (!request)
      throw new Error("No request received from get-wallet in Wallet");
    const userMail = await request.json();
    // console.log(userMail);
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: userMail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const walletId = userFound.wallet;
   
     //FIND WALLET
     const walletFound = await Wallet.findById(walletId).lean()
     // .populate({
     //     path: "budget.individualBudget.category",
     // })
     //IF ERROR
     if(!walletFound) throw new Error("Wallet no found, review the wallet id on GENERAL-DATA POST");
     // console.log(walletFound)

    return NextResponse.json({
      data: walletFound,
      message: "Categories and SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e)
    throw new Error(e);
  }
}
