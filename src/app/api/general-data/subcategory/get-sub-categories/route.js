

import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";
import User from "@/model/User";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const userMail = await request.json();
    // console.log(userMail);
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
    //
    // console.log(userFound)
    //FIND CATEGORIES
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
        "No categories found, review the user and wallet id on GENERAL-DATA POST"
      );
    // console.log(subCategoriesFounded)
    //FIND DEFUALT CATEGORIES
    const defaultSubCategoriesFounded = await SubCategory.find({
      isDefaultCatego: true,
    })
    .lean()
    .populate({
      path: "fatherCategory",
    });
    // console.log(defaultSubCategoriesFounded)
    if (!defaultSubCategoriesFounded)
      throw new Error(
        "No SubCategories found, review the user and wallet id on GENERAL-DATA POST"
      );
    // console.log(defaultSubCategoriesFounded)
    const dataFull = {
      subCategories: subCategoriesFounded,
      defSubCategories: defaultSubCategoriesFounded,
    };
    return NextResponse.json({
      data: dataFull,
      message: "SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e)
    throw new Error(e);
  }
}
