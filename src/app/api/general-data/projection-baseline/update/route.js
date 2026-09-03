import ProjectionBaseline from "@/model/ProjectionBaseline";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import { majorToMinor, SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on UPDATE PROJECTION BASELINE POST");
    const { mail, kind, entryId, effectiveFrom, effectiveTo, amount, currency } = await request.json();
    if (!mail || !effectiveFrom || !kind)
      throw new Error(`No mail/kind/effectiveFrom was provided to update the projection baseline 🤕`);
    if (kind !== "income" && kind !== "expense")
      throw new Error(`kind must be "income" or "expense" 🤕`);
    if (currency && !SUPPORTED_CURRENCIES.includes(currency))
      throw new Error(`Unsupported currency: ${currency} 🤕`);
    if (effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom))
      throw new Error(`effectiveTo must be after effectiveFrom 🤕`);
    await dbConnection();
    const userFound = await User.findOne({ mail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const userId = userFound._id;
    const walletId = userFound.wallet;
    const parentWallet = await Wallet.findById(walletId).lean();
    // Each entry keeps whatever currency the user actually earned/spent it
    // in (e.g. a USD paycheck) - defaults to the Wallet's primary currency
    // when not specified. Converting to primary currency for the math
    // happens client-side at read time, same as Income Sources already do.
    const entryCurrency = currency || parentWallet?.primaryCurrency || "MXN";

    let baseline = await ProjectionBaseline.findOne({ wallet: walletId });
    if (!baseline) {
      baseline = new ProjectionBaseline({ user: userId, wallet: walletId, incomeHistory: [], expenseHistory: [] });
    }
    // Income and expense are independent timelines - each entry only ever
    // touches its own array, so adding an expense guess never disturbs the
    // income timeline (and vice versa). When entryId is provided, edit that
    // entry in place instead of appending a new one - so fixing a typo
    // doesn't require deleting and re-adding.
    const field = kind === "income" ? "incomeHistory" : "expenseHistory";
    const moneyField = kind === "income" ? "incomeMoney" : "expenseMoney";
    baseline[field] = baseline[field] || [];
    const newValues = {
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      [moneyField]: { amountMinor: majorToMinor(amount || 0, entryCurrency), currency: entryCurrency },
    };
    if (entryId) {
      const existing = baseline[field].find((entry) => String(entry._id) === String(entryId));
      if (!existing) throw new Error(`No ${kind} baseline entry was found with that id to edit 🤕`);
      Object.assign(existing, newValues);
    } else {
      baseline[field].push(newValues);
    }
    const savedBaseline = await baseline.save();

    if (!savedBaseline) throw new Error("Projection Baseline was not saved 🤕");
    return NextResponse.json({
      message: `Projection Baseline was updated successfully 🤓`,
      data: savedBaseline,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
