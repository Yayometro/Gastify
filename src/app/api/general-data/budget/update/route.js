import Budget from "@/model/Budget";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    const { id, name, goalAmount, category, subCategory, isSurpassed, isSaving, savingAmount } =
      await request.json();
    await dbConnection();
    // NO ID FILTER
    if (!id) throw new Error(`No ID  was provided to update budget 🤕`);
    // FIND WALLET and UPDATE
    const updateBudget = await Budget.findById(id);
    //IF ERROR
    if (!updateBudget) throw new Error(`No Budget was identified to update 🤕`);
    //UPDATE:
    //name
    updateBudget.name = !name ? updateBudget.name : name;
    //goalAmount
    updateBudget.goalAmount = !goalAmount
      ? updateBudget.goalAmount
      : goalAmount;
    //isSurpassed
    updateBudget.isSurpassed = !isSurpassed
      ? updateBudget.isSurpassed
      : isSurpassed;
    //category
    updateBudget.category = !category ? updateBudget.category : category;
    //subCategory
    updateBudget.subCategory = !subCategory ? updateBudget.subCategory : subCategory;
    //isSaving
    updateBudget.isSaving = !isSaving ? updateBudget.isSaving : isSaving;
    //savingAmount
    updateBudget.savingAmount = !savingAmount ? updateBudget.savingAmount : savingAmount;
    // SAVE
    const savedBudget = await updateBudget.save();
    //IF ERROR
    if (!savedBudget) throw new Error("Updated Budget was not saved 🤕");
    return NextResponse.json({
      message: `${savedBudget.name} was updated successfully 🤓`,
      data: savedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
