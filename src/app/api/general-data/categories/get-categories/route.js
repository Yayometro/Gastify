import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category from "@/model/Category";
import User from "@/model/User";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
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
    const dataFull = {
      categories: categoriesFounded,
      defCat: defaultCategoriesFounded,
    };
    return NextResponse.json({
      data: dataFull,
      message: "Categories and SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    throw new Error(e);
  }
}
