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
    const { mail, year, unexpectedBuffer, unexpectedIncomeBuffer, monthBalance } =
      await request.json();
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
    let settings = await ProjectionSettings.findOne({ wallet: walletId, year });
    if (!settings) {
      settings = new ProjectionSettings({ user: userId, wallet: walletId, year });
    }
    // only touch fields that were actually sent, so one field's update
    // (e.g. monthBalance) doesn't silently reset the others to their default
    if (unexpectedBuffer !== undefined) settings.unexpectedBuffer = unexpectedBuffer;
    if (unexpectedIncomeBuffer !== undefined)
      settings.unexpectedIncomeBuffer = unexpectedIncomeBuffer;
    if (monthBalance && monthBalance.month !== undefined) {
      settings.monthlyBalances = settings.monthlyBalances || [];
      const existing = settings.monthlyBalances.find((m) => m.month === monthBalance.month);
      if (existing) {
        existing.balance = monthBalance.balance;
      } else {
        settings.monthlyBalances.push({ month: monthBalance.month, balance: monthBalance.balance });
      }
    }
    const savedSettings = await settings.save();

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
