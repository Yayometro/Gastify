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
    // VERSION HISTORY if goalAmount/savingAmount is actually changing
    const amountIsChanging =
      (!!goalAmount && goalAmount !== updateBudget.goalAmount) ||
      (!!savingAmount && savingAmount !== updateBudget.savingAmount);
    if (amountIsChanging) {
      const now = new Date();
      const openEntry = updateBudget.history?.find((h) => !h.effectiveTo);
      if (openEntry) openEntry.effectiveTo = now;
      updateBudget.history = updateBudget.history || [];
      updateBudget.history.push({
        goalAmount: !goalAmount ? updateBudget.goalAmount : goalAmount,
        savingAmount: !savingAmount ? updateBudget.savingAmount : savingAmount,
        effectiveFrom: now,
        effectiveTo: null,
      });
    }
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
    //category (undefined = don't touch; null/id = set it, including explicitly clearing it)
    updateBudget.category = category === undefined ? updateBudget.category : category;
    //subCategory (same as category - null explicitly clears it, e.g. switching to a parent-only category)
    updateBudget.subCategory = subCategory === undefined ? updateBudget.subCategory : subCategory;
    //isSaving (boolean, so check for undefined rather than falsy - false is a valid value)
    updateBudget.isSaving = isSaving === undefined ? updateBudget.isSaving : isSaving;
    //savingAmount
    updateBudget.savingAmount = !savingAmount ? updateBudget.savingAmount : savingAmount;
    // SAVE
    const savedBudget = await updateBudget.save();
    //IF ERROR
    if (!savedBudget) throw new Error("Updated Budget was not saved 🤕");
    await savedBudget.populate([{ path: "category" }, { path: "subCategory" }]);
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
