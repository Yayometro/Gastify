import dbConnection from "../../../dbConnection";
import { NextResponse } from "next/server";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Account from "@/model/Account";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on Update Many Trans");
    const body = await request.json();
    const {
      transactions,
      fields, // array of field names to update, e.g. ["name"] or ["category","subCategory"]
      name,
      amount,
      isIncome,
      isBill,
      isReadable,
      date,
      account,
      category,
      subCategory,
      tags,
    } = body;

    await dbConnection();

    if (!transactions || transactions.length === 0)
      throw new Error("No transaction IDs passed to edit-many");

    // If no fields array provided fall back to updating all truthy values (legacy behaviour)
    const targeted = Array.isArray(fields) && fields.length > 0;
    const shouldUpdate = (field) => !targeted || fields.includes(field);

    let savedTrans = [];

    for (const transId of transactions) {
      const transaction = await Transaction.findById(transId);
      if (!transaction) throw new Error(`Transaction ${transId} not found`);

      if (shouldUpdate("name") && name !== undefined && name !== "")
        transaction.name = name;

      if (shouldUpdate("amount") && amount !== undefined && amount !== "")
        transaction.amount = amount;

      if (shouldUpdate("isIncome") || shouldUpdate("isBill")) {
        if (isIncome !== undefined) transaction.isIncome = isIncome;
        if (isBill !== undefined) transaction.isBill = isBill;
      }

      if (shouldUpdate("isReadable") && isReadable !== undefined)
        transaction.isReadable = isReadable;

      if (shouldUpdate("date") && date)
        transaction.date = new Date(date);

      if (shouldUpdate("account"))
        transaction.account = account || null;

      // Category / subcategory
      if (shouldUpdate("subCategory") && subCategory) {
        const foundSub = await SubCategory.findById(subCategory);
        if (!foundSub) throw new Error("SubCategory not found at edit-many");
        transaction.subCategory = foundSub._id;
        transaction.category = foundSub.fatherCategory;
      } else if (shouldUpdate("category") && category && !subCategory) {
        transaction.category = category;
        if (shouldUpdate("subCategory")) transaction.subCategory = null;
      }

      // Tags — only update if field is targeted or tags array is provided
      if (shouldUpdate("tags") && Array.isArray(tags)) {
        const newTags = [];
        for (const tagName of tags.filter(Boolean)) {
          let found = await Tag.findOne({ name: tagName, user: transaction.user });
          if (!found) {
            found = await Tag.create({ name: tagName, user: transaction.user });
          }
          newTags.push(found._id);
        }
        transaction.tags = newTags;
      }

      const updated = await transaction.save();
      const populated = await Transaction.findById(updated._id)
        .populate("tags")
        .populate("account")
        .populate("category")
        .populate("subCategory");

      savedTrans.push(populated);
    }

    return NextResponse.json({
      message: `${savedTrans.length} transaction(s) updated successfully 😎`,
      data: savedTrans,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.error("edit-many error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
