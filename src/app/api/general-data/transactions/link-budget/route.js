import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Budget from "@/model/Budget";
import Tag from "@/model/Tag";
import Account from "@/model/Account";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";

export async function POST(request) {
  try {
    const { transactionId, budgetId } = await request.json();
    if (!transactionId) throw new Error("Transaction id is required");
    await dbConnection();

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) throw new Error("Transaction was not found");

    if (budgetId) {
      const budget = await Budget.findOne({
        _id: budgetId,
        user: transaction.user,
        wallet: transaction.wallet,
        archived: { $ne: true },
      });
      if (!budget || (budget.budgetType || (budget.isSaving ? "saving" : "spending")) !== "project") {
        throw new Error("Project budget was not found");
      }
      transaction.budget = budget._id;
    } else {
      transaction.budget = null;
    }

    await transaction.save();
    const populated = await Transaction.findById(transaction._id)
      .populate("tags")
      .populate("account")
      .populate("category")
      .populate("subCategory")
      .populate("budget");

    return NextResponse.json({
      ok: true,
      status: 201,
      message: budgetId ? "Movement added to project" : "Movement removed from project",
      data: populated,
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
