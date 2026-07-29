import IncomeSource from "@/model/IncomeSource";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on GET INCOME SOURCE POST");
    const id = await request.json();
    // NO ID FILTER
    if (!id) throw new Error(`No mail was provided to get income sources 🤕`);
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: id }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const userId = userFound._id;
    const walletId = userFound.wallet;

    const findIncomeSources = await IncomeSource.find({
      user: userId,
      wallet: walletId,
      archived: { $ne: true },
    }).lean();
    if (!findIncomeSources) throw new Error("Income Sources were not found 🤕");
    return NextResponse.json({
      message: `Income Sources were found successfully 🤓`,
      data: findIncomeSources,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
