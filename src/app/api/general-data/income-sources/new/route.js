import IncomeSource from "@/model/IncomeSource";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on NEW INCOME SOURCE POST");
    const { user, wallet, name, amount, currency, recurrence, anchorDate } =
      await request.json();
    await dbConnection();
    // NO USER/WALLET FILTER
    if (!user && !wallet)
      throw new Error(
        `No User and Wallet was provided to create a new Income Source 🤕`
      );
    const now = new Date();
    const newIncomeSource = new IncomeSource({
      name: name || null,
      amount: amount || 0,
      currency: currency || null,
      recurrence: recurrence || "monthly",
      anchorDate: anchorDate || now,
      user: user,
      wallet: wallet,
      active: true,
      history: [{
        amount: amount || 0,
        recurrence: recurrence || "monthly",
        effectiveFrom: now,
        effectiveTo: null,
      }],
    });
    //IF ERROR
    if (!newIncomeSource) throw new Error(`No Income Source was identified 🤕`);
    // SAVE
    const savedIncomeSource = await newIncomeSource.save();
    //IF ERROR
    if (!savedIncomeSource) throw new Error("New Income Source was not saved 🤕");
    return NextResponse.json({
      message: `${savedIncomeSource.name} was created successfully 🤓`,
      data: savedIncomeSource,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
