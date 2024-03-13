import Budget from "@/model/Budget";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    const id = await request.json();
    // NO ID FILTER
    if (!id) throw new Error(`No ID  was provided to update budget 🤕`);
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: id }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const userId = userFound._id;
    const walletId = userFound.wallet;
    
    // FIND WALLET and UPDATE
    const findBudgets = await Budget.find({
        user: userId,
        wallet: walletId,
      })
      .lean()
      .populate({
        path: "category",
      })
      .populate({
        path: "subCategory",
      })
    // console.log(findBudgets)
    if (!findBudgets) throw new Error("Updated Budget was not saved 🤕");
    return NextResponse.json({
      message: `Budgest were found successfully 🤓`,
      data: findBudgets,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
