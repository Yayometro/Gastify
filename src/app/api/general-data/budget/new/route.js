import Budget from "@/model/Budget";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    const {
      user,
      wallet,
      name,
      goalAmount,
      category,
      subCategory,
      savingAmount,
      isSaving
    } = await request.json();
    await dbConnection();
    // NO USER/WALLET FILTER
    if (!user && !wallet)
      throw new Error(
        `No User and Wallet was provided to create a new Budget 🤕`
      );
    // FIND WALLET
    const newBudget = new Budget({
      name: name || null,
      goalAmount: goalAmount || 1,
      isSurpassed: false,
      user: user,
      wallet: wallet,
      isSaving: isSaving || false,
      savingAmount: savingAmount || 0
    });
    newBudget.category = category || null;
    newBudget.subCategory = subCategory || null;
    //IF ERROR
    if (!newBudget) throw new Error(`No Budget was identified 🤕`);
    // SAVE
    const savedBudget = await newBudget.save();
    //IF ERROR
    if (!savedBudget) throw new Error("New Budget was not saved 🤕");
    return NextResponse.json({
      message: `${savedBudget.name} was created successfully 🤓`,
      data: savedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
