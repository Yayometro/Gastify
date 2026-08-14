import Budget from "@/model/Budget";
import Transaction from "@/model/Transaction";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    const {id} = await request.json();
    await dbConnection();
    // NO ID FILTER
    if (!id)
      throw new Error(
        `No ID was provided to removed the budget 🤕`
      );
    // SOFT DELETE: keep the document so past months in Projections can still read its history
    const removedBudget = await Budget.findById(id);
    //IF ERROR
    if(!removedBudget) throw new Error("Budget was not removed, verify data ❌")
    removedBudget.archived = true;
    const openEntry = removedBudget.history?.find((h) => !h.effectiveTo);
    if (openEntry) openEntry.effectiveTo = new Date();
    await removedBudget.save();
    if ((removedBudget.budgetType || (removedBudget.isSaving ? "saving" : "spending")) === "project") {
      // Removing a project never removes its movements; they simply become
      // available for another project (and visible as unbudgeted again).
      await Transaction.updateMany({ budget: removedBudget._id }, { $unset: { budget: 1 } });
    }
    console.log(removedBudget)
    return NextResponse.json({
      message: `Budget ${removedBudget?.name} was removed 🤓`,
      data: removedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
