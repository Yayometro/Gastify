import dbConnection from "../../../dbConnection";
import { NextResponse } from "next/server";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on Update Many Trans");
    const {
      transactions,
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
    } = await request.json();
    console.log(
      transactions,
      name,
      amount,
      isIncome,
      isBill,
      isReadable,
      date,
      account,
      category,
      subCategory,
      tags
    );
    await dbConnection();
    //Validators
    if (!transactions)
      throw new Error("No transactions IDs passed to edit many 🤕");
    let savedTrans = [];
    for (const transId of transactions) {
      const transaction = await Transaction.findById(transId);
      console.log(transaction);
      if (!transaction) {
        throw new Error(`Transaction ${transId} not found on update many`);
        // continue; // jump iteration
      }
      //Update
      transaction.name = name || transaction.name;
      transaction.amount = amount || transaction.amount;
      transaction.isIncome = isIncome || transaction.isIncome;
      transaction.isBill = isBill || transaction.isBill;
      transaction.isReadable = isReadable || transaction.isReadable;
      transaction.date = !date ? transaction.date : new Date(date);
      transaction.account = account || transaction.account;
      //   console.log('first')
      //SUB
      if (transaction.subCategory !== subCategory && subCategory) {
        if (!subCategory) return null;
        const findSubCategory = await SubCategory.findById(subCategory);
        console.log(findSubCategory);
        if (!findSubCategory)
          throw new Error("No SUB-CATEGORY found at UPDATE TRANSACTION");
        transaction.category = findSubCategory.fatherCategory;
        transaction.subCategory = findSubCategory._id;
      }
      // CATEGORY UPDATE
      if (category && !subCategory) {
        // console.log('first')
        transaction.category = !category ? transaction.category : category;
      }
      // TAGS UPATE
      if (!tags) return null;
      if (!tags.length < 0) return null;
      const newTags = [];
      for (const tag of tags) {
        const findTag = await Tag.findOne({
          name: tag,
          user: transaction.user,
        });
        console.log(findTag);
        if (!findTag) {
          const newTag = new Tag({ name: tag, user: transaction.user });
          if (!newTag)
            throw new Error("No tag created on UPDATED TRANSACTION POST");
          newTags.push(newTag._id);
          await newTag.save();
        } else {
          newTags.push(findTag._id);
        }
      }
      transaction.tags = newTags;

      // Guardar la transacción actualizada
      const updatedTrans = await transaction.save()
      const transToSend = await Transaction.findById(updatedTrans._id)
        .populate({
          path: "tags",
        })
        .populate({
          path: "account",
        })
        .populate({
          path: "category",
        })
        .populate({
          path: "subCategory",
        });
      //Push to send data
      savedTrans.push(transToSend);
    }
    console.log(savedTrans);
    return NextResponse.json({
      message: `${savedTrans.length} transactions were updated successfully 😎`,
      data: savedTrans,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

//Logers:
// console.log(
//      user,
//      wallet,
//      name,
//      amount,
//      isIncome,
//      isBill,
//      isReadable,
//      date,
//      categories,
//      tags,
//      accounts)
