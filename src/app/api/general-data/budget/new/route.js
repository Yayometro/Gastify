import Budget from "@/model/Budget";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
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
      isSaving,
      categories,
      period,
      linkedAccounts
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
      savingAmount: savingAmount || 0,
      period: period || "monthly",
      linkedAccounts: linkedAccounts || [],
      history: [{
        goalAmount: goalAmount || 1,
        savingAmount: savingAmount || 0,
        effectiveFrom: new Date(),
        effectiveTo: null,
      }],
    });
    newBudget.category = category || null;
    newBudget.subCategory = subCategory || null;
    if (categories && Array.isArray(categories) && categories.length > 0) {
      newBudget.categories = categories;
    }
    //IF ERROR
    if (!newBudget) throw new Error(`No Budget was identified 🤕`);
    // SAVE
    const savedBudget = await newBudget.save();
    //IF ERROR
    if (!savedBudget) throw new Error("New Budget was not saved 🤕");
    await savedBudget.populate([
      { path: "category", strictPopulate: false },
      { path: "subCategory", strictPopulate: false },
      { path: "categories.category", strictPopulate: false },
      { path: "categories.subCategory", strictPopulate: false },
      { path: "linkedAccounts", strictPopulate: false },
    ]);
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
