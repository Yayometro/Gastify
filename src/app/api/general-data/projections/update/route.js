import ProjectionSettings from "@/model/ProjectionSettings";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on UPDATE PROJECTION SETTINGS POST");
    const { mail, year, unexpectedBuffer } = await request.json();
    if (!mail || !year)
      throw new Error(`No mail/year was provided to update projection settings 🤕`);
    await dbConnection();
    const userFound = await User.findOne({ mail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const userId = userFound._id;
    const walletId = userFound.wallet;

    // GET-OR-CREATE: one settings document per wallet+year
    const savedSettings = await ProjectionSettings.findOneAndUpdate(
      { wallet: walletId, year },
      {
        $set: {
          unexpectedBuffer: unexpectedBuffer ?? 0,
          user: userId,
          wallet: walletId,
          year,
        },
      },
      { upsert: true, new: true }
    );

    if (!savedSettings) throw new Error("Projection Settings were not saved 🤕");
    return NextResponse.json({
      message: `Projection Settings were updated successfully 🤓`,
      data: savedSettings,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
