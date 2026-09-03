import ProjectionSettings from "@/model/ProjectionSettings";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import { majorToMinor } from "@/lib/money/currencies";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on UPDATE PROJECTION SETTINGS POST");
    const { mail, year, monthBuffer, monthBalance } =
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
    const parentWallet = await Wallet.findById(walletId).lean();
    // New manual entries are stamped with the Wallet's primary currency at
    // the moment they're saved (plan section 7.6) - this never changes
    // retroactively if the Wallet's primary currency changes later, unlike
    // the legacy MXN-implicit fields kept alongside for the transition.
    const walletPrimaryCurrency = parentWallet?.primaryCurrency || "MXN";

    // GET-OR-CREATE: one settings document per wallet+year
    let settings = await ProjectionSettings.findOne({ wallet: walletId, year });
    if (!settings) {
      settings = new ProjectionSettings({ user: userId, wallet: walletId, year });
    }
    // only touch fields that were actually sent, so one field's update
    // (e.g. monthBalance) doesn't silently reset the others to their default
    if (monthBuffer && monthBuffer.month !== undefined) {
      settings.monthlyBuffers = settings.monthlyBuffers || [];
      const expenseMoney = { amountMinor: majorToMinor(monthBuffer.unexpectedBuffer || 0, walletPrimaryCurrency), currency: walletPrimaryCurrency };
      const incomeMoney = { amountMinor: majorToMinor(monthBuffer.unexpectedIncomeBuffer || 0, walletPrimaryCurrency), currency: walletPrimaryCurrency };
      const updatedAt = new Date();
      const revision = {
        unexpectedBuffer: monthBuffer.unexpectedBuffer,
        unexpectedIncomeBuffer: monthBuffer.unexpectedIncomeBuffer,
        expenseMoney,
        incomeMoney,
        updatedAt,
      };
      const existing = settings.monthlyBuffers.find((m) => m.month === monthBuffer.month);
      if (existing) {
        existing.unexpectedBuffer = monthBuffer.unexpectedBuffer;
        existing.unexpectedIncomeBuffer = monthBuffer.unexpectedIncomeBuffer;
        existing.expenseMoney = expenseMoney;
        existing.incomeMoney = incomeMoney;
        existing.revisions = existing.revisions || [];
        existing.revisions.push(revision);
      } else {
        settings.monthlyBuffers.push({
          month: monthBuffer.month,
          unexpectedBuffer: monthBuffer.unexpectedBuffer,
          unexpectedIncomeBuffer: monthBuffer.unexpectedIncomeBuffer,
          expenseMoney,
          incomeMoney,
          revisions: [revision],
        });
      }
    }
    if (monthBalance && monthBalance.month !== undefined) {
      settings.monthlyBalances = settings.monthlyBalances || [];
      const money = { amountMinor: majorToMinor(monthBalance.balance || 0, walletPrimaryCurrency), currency: walletPrimaryCurrency };
      const updatedAt = new Date();
      const revision = { balance: monthBalance.balance, money, updatedAt };
      const existing = settings.monthlyBalances.find((m) => m.month === monthBalance.month);
      if (existing) {
        existing.balance = monthBalance.balance;
        existing.money = money;
        existing.revisions = existing.revisions || [];
        existing.revisions.push(revision);
      } else {
        settings.monthlyBalances.push({ month: monthBalance.month, balance: monthBalance.balance, money, revisions: [revision] });
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
