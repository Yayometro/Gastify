import dbConnection from "../../../dbConnection";
import { NextResponse } from "next/server";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import Account from "@/model/Account";
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

export async function POST(request, { params }) {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    let {
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
    // console.log(name,
    //     amount,
    //     isIncome,
    //     isBill,
    //     isReadable,
    //     date,
    //     account,
    //     category,
    //     subCategory,
    //     tags)
    //Validators
    if (!params)
      throw new Error("No params ID send to work on POST UPDATE TRANSACTION");
    // //

    await dbConnection();
    const findTrans = await Transaction.findById(params.id);
    // console.log(findTrans)
    if (!findTrans)
      throw new Error("No Transactions found work on POST UPDATE TRANSACTION");
    // UPDATES:
    findTrans.name = !name ? findTrans.name : name;
    findTrans.amount = !amount ? findTrans.amount : amount;
    findTrans.isIncome = !isIncome ? findTrans.isIncome : isIncome;
    findTrans.isBill = !isBill ? findTrans.isBill : isBill;
    findTrans.isReadable = !isReadable ? findTrans.isReadable : isReadable;
    findTrans.date = !date ? findTrans.date : new Date(date);
    findTrans.account = !account ? findTrans.account : account;
    // SUB CCATEGORY UPD
    if (subCategory) {
      if (findTrans.subCategory !== subCategory) {
        let findSubCategory = await SubCategory.findById(subCategory).lean();
        // console.log(findSubCategory);
        if (!findSubCategory)
          throw new Error("No SUB-CATEGORY found at UPDATE TRANSACTION");
        findTrans.category = findSubCategory.fatherCategory;
        findTrans.subCategory = findSubCategory._id;
      }
    }
    // CATEGORY UPDATE
    if (category && !subCategory) {
      console.log('first')
      findTrans.category = !category ? findTrans.category : category;
    }
    // TAGS UPDATE
    if (!tags) return null;
    if (!tags.length < 0) return null;
    const newTags = [];
    // console.log('first')
    for (const tag of tags) {
      const findTag = await Tag.findOne({ name: tag, user: findTrans.user });
      // console.log(findTag)
      if (!findTag) {
        const newTag = new Tag({ name: tag, user: findTrans.user });
        if (!newTag)
          throw new Error("No tag created on UPDATED TRANSACTION POST");
        newTags.push(newTag._id);
        await newTag.save();
      } else {
        newTags.push(findTag._id);
      }
    }
    // console.log('first')
    findTrans.tags = newTags;
    // console.log(findTrans)
    //SAVE
    const updatedTrans = await findTrans.save()
    // console.log(updatedTrans)
    if (!updatedTrans)
      throw new Error("NEW TRANSACTIONS could not be saved on POST");
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
    // console.log(updatedTrans)
    if (!transToSend)
      throw new Error("Updated transaction -transToSend- could not be loaded to send");
    return NextResponse.json({
      message: `${
        updatedTrans.name ? updatedTrans.name : "Transacion"
      } was updated successfully 😎`,
      data: transToSend,
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
