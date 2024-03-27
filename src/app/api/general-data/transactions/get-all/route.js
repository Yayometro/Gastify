import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import User from "@/model/User";
import Account from "@/model/Account";
import Tag from "@/model/Tag";

export async function POST(request) {
  try {
    if (!request)
      throw new Error("No request received from get-all in Transactions");
    const userMail = await request.json();
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: userMail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const userId = userFound._id;
    const walletId = userFound.wallet;
    userFound.password = null;
    //FIND TRANSACTIONS
    const movementsFounded = await Transaction.find({
      user: userId,
      wallet: walletId,
    })
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
    if (!movementsFounded)
      throw new Error(
        "No movements found, review the user and wallet id on get-all/transactions in POST"
      );
    //FIND CATEGORIES
    const categoriesFounded = await Category.find({
      user: userId,
      wallet: walletId,
    }).lean();
    if (!categoriesFounded)
      throw new Error(
        "No categories found, review the user and wallet id on GENERAL-DATA POST"
      );
    //FIND DEFUALT CATEGORIES
    const defaultCategoriesFounded = await Category.find({
      isDefaultCatego: true,
    }).lean();
    if (!defaultCategoriesFounded)
      throw new Error(
        "No default categories found, review the user and wallet id on GENERAL-DATA POST"
      );
    // console.log(categoriesFounded)
    //FIND SUB CATEGORIES
    const subCategoriesFounded = await SubCategory.find({
      user: userId,
      wallet: walletId,
    })
      .lean()
      .populate({
        path: "fatherCategory",
      });
    if (!subCategoriesFounded)
      throw new Error(
        "No SubCategories found, review the user and wallet id on GENERAL-DATA POST"
      );
    // ACCOUNTS
      const accountsFounded = await Account.find({
        user: userId,
        wallet: walletId,
      })
      if (!accountsFounded)
      throw new Error(
        "No Accounts found, review the user and wallet id on GENERAL-DATA POST"
      );
    // console.log(subCategoriesFounded)
    const dataFull = {
      user: userFound,
      transaction: movementsFounded,
      categories: categoriesFounded,
      defCat: defaultCategoriesFounded,
      subCategories: subCategoriesFounded,
      accounts: accountsFounded,
    };
    return NextResponse.json({
      data: dataFull,
      message: "Categories and SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e)
    throw new Error(e);
  }
}
