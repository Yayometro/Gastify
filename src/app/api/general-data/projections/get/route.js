import ProjectionSettings from "@/model/ProjectionSettings";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on GET PROJECTION SETTINGS POST");
    const { mail, year } = await request.json();
    if (!mail || !year)
      throw new Error(`No mail/year was provided to get projection settings 🤕`);
    await dbConnection();
    const userFound = await User.findOne({ mail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const walletId = userFound.wallet;

    const settings = await ProjectionSettings.findOne({
      wallet: walletId,
      year,
    }).lean();

    return NextResponse.json({
      message: `Projection Settings were looked up successfully 🤓`,
      data: settings || null,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
