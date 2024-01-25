import dbConnection from "../../../dbConnection";
import { NextResponse } from "next/server";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";

export async function GET() {
  try {
    return NextResponse.json({
      message: "Data founded in new Transaction",
      status: 201,
      ok: true,
    });
  } catch (e) {
    throw new Error(e);
  }
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    let {
      user,
      wallet,
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
    //Validators
    if (!user) throw new Error("No User ID finded to create a new Transaction");
    if (!wallet)
      throw new Error("No Wallet ID finded to create a new Transaction");
    if (!amount)
      throw new Error("No Amount finded to create a new Transaction");
    if (!isIncome && !isBill) {
      isBill = true;
    }
    if (isIncome == true && isBill == true) {
      isBill = true;
      isIncome = false;
    }
    if (!isReadable) isReadable = true;
    // //
    await dbConnection();
    const newTransacction = new Transaction({
      user,
      wallet,
      name: !name ? "transaction nameless" : name,
      amount,
      isIncome,
      isBill,
      isReadable,
      date: !date ? new Date() : new Date(date),
      account: !account ? null : account,
    });
    if (subCategory) {
      console.log(subCategory);
      let findSubCategory = await SubCategory.findById(subCategory).lean();
      if (!findSubCategory)
        throw new Error("No SUB-CATEGORY found at NEW TRANSACTION");
      newTransacction.category = findSubCategory.fatherCategory;
      newTransacction.subCategory = findSubCategory._id;
    }
    if (category && !subCategory) {
      console.log(category);
      newTransacction.category = category;
    }
    if (tags) {
      if (tags.length > 0) {
        for (const tag of tags) {
          //Use "for of", because it handles async rather than map or foreach
          const findTag = await Tag.findOne({ name: tag });
          if (!findTag) {
            const newTag = new Tag({ name: tag, user: user });
            if (!newTag)
              throw new Error("No tag created on NEW TRANSACTION POST");
            newTransacction.tags.push(newTag._id);
            await newTag.save();
          }
          if (findTag) {
            newTransacction.tags.push(findTag._id);
          }
        }
      }
    }
    const savedTransacction = await newTransacction.save();
    if (!savedTransacction)
      throw new Error("NEW TRANSACTIONS could not be saved on POST");
    console.log(savedTransacction);
    const finalTransaction = await Transaction.findById(savedTransacction._id)
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
      if (!finalTransaction)
      throw new Error("NEW TRANSACTIONS could not be loaded on POST");
    return NextResponse.json({
      message: `${
        savedTransacction.name || "Transaction"
      } was created successfully`,
      data: finalTransaction,
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
//     user,
//     wallet,
//     name,
//     amount,
//     isIncome,
//     isBill,
//     isReadable,
//     date,
//     account,
//     category,
//     subCategory,
//     tags
// )
