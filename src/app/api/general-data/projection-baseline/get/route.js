import ProjectionBaseline from "@/model/ProjectionBaseline";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on GET PROJECTION BASELINE POST");
    const { mail } = await request.json();
    if (!mail) throw new Error(`No mail was provided to get the projection baseline 🤕`);
    await dbConnection();
    const userFound = await User.findOne({ mail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const walletId = userFound.wallet;

    // Not every wallet has one yet - null is a valid, expected result.
    const baseline = await ProjectionBaseline.findOne({ wallet: walletId }).lean();
    return NextResponse.json({
      message: `Projection Baseline was found successfully 🤓`,
      data: baseline,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
