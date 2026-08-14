import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import Account from "@/model/Account";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on APPLY SUGGESTIONS POST");
    // applications: [{ transactionId, category, subCategory }] - each row can carry
    // a different category, unlike edit-many which applies one value to a whole batch.
    const { applications } = await request.json();
    if (!Array.isArray(applications) || applications.length === 0)
      throw new Error("No applications were provided to apply-suggestions 🤕");
    await dbConnection();

    const updated = [];
    for (const app of applications) {
      if (!app.transactionId) continue;
      const transaction = await Transaction.findById(app.transactionId);
      if (!transaction) continue;
      if (app.subCategory) transaction.subCategory = app.subCategory;
      if (app.category) transaction.category = app.category;
      await transaction.save();
      updated.push(transaction._id);
    }

    const populated = await Transaction.find({ _id: { $in: updated } })
      .populate("category")
      .populate("subCategory")
      .populate("tags")
      .populate("account")
      .lean();

    return NextResponse.json({
      message: `${populated.length} transaction(s) categorized`,
      data: populated,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
