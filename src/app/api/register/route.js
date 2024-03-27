import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnection from "../dbConnection";
import bcryptjs from "bcryptjs";

import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import Budget from "@/model/Budget";

export async function POST(request) {
  try {
    await dbConnection();
    // Check DEF CARTEGORIES:
    // const isDefCategories = await defCategoriesCreator()
    // if(!isDefCategories) throw new Error("Some issue while runing defCategoriesCreator function")
    //
    const dataFront = await request.json();
    const mailUsed = await User.findOne({ mail: dataFront.mail });
    if (mailUsed) {
      return NextResponse.json({
        error: `This mail(${mailUsed.mail}) is already registered with us. Please set up a new email account.`,
        errorUser: true,
      });
    }
    // Encrypt:
    const salt = await bcryptjs.genSalt(10);
    const contraseñaCifrada = await bcryptjs.hash(dataFront.password, salt);
    // NEW USER AND ITEMS
    const newUser = new User({
      fullName: dataFront.fullName,
      mail: dataFront.mail,
      password: dataFront.password,
      image: dataFront.image ? dataFront.image : "",
    });
    newUser.password = contraseñaCifrada;
    const newAssociateWallet = new Wallet({
      name: `${dataFront.fullName} Wallet`,
      cash: 0,
    });
    const newAssociateAccount = new Account({
      name: `${dataFront.fullName} General Account`,
      amount: Number(0),
    });
    const firstAssociateTransaction = new Transaction({
      name: `${dataFront.fullName} first transaction`,
      amount: Number(1),
      isIncome: true,
      isReadable: true,
      date: new Date(),
    });
    const fisrtAssociateCategory = new Category({
      name: `${dataFront.fullName} First Category`,
    });
    const fisrtAssociateSubCategory = new SubCategory({
      name: `${dataFront.fullName} First Sub Category`,
    });
    const fisrtAssociateTag = new Tag({
      name: `${dataFront.fullName} First Tag`,
      user: newUser._id,
    });
    const firstBudget = new Budget({
      name: `${dataFront.fullName} First Budget`,
      goalAmount: 1,
      isSurpassed: false,
      isSaving: false,
      savingAmount: 0
    });
    //Associations
    // USER
    newUser.wallet = newAssociateWallet._id;
    // WALLET
    newAssociateWallet.user = newUser._id;
    newAssociateWallet.budget.totalBudget = 1000,
    newAssociateWallet.budget.totalSavings = 1000,
    newAssociateWallet.budget.isSaved = false,
    newAssociateWallet.budget.isSurpassed = false,
    //ACCOUNT
    newAssociateAccount.user = newUser._id;
    newAssociateAccount.wallet = newAssociateWallet._id;
    //BUDGET:
    firstBudget.user = newUser._id;
    firstBudget.wallet = newAssociateWallet._id;
    firstBudget.category = fisrtAssociateCategory._id;
    firstBudget.subCategory = fisrtAssociateSubCategory._id;
    //TRANSACCTION
    firstAssociateTransaction.user = newUser._id;
    firstAssociateTransaction.wallet = newAssociateWallet._id;
    firstAssociateTransaction.account = newAssociateAccount._id;
    firstAssociateTransaction.category = fisrtAssociateCategory._id;
    firstAssociateTransaction.subCategory = fisrtAssociateSubCategory._id;
    firstAssociateTransaction.tags.push(fisrtAssociateTag._id);
    // CATEGORY
    fisrtAssociateCategory.user = newUser._id;
    fisrtAssociateCategory.wallet = newAssociateWallet._id;
    fisrtAssociateCategory.accounts.push(newAssociateAccount._id);
    fisrtAssociateCategory.icon = "fa/FaTags"
    // SUB-CATEGORY
    fisrtAssociateSubCategory.user = newUser._id;
    fisrtAssociateSubCategory.wallet = newAssociateWallet._id;
    fisrtAssociateSubCategory.fatherCategory = fisrtAssociateCategory._id;
    fisrtAssociateSubCategory.icon = "fa/FaTag"
    //TAG
    fisrtAssociateTag.user = newUser._id;
    fisrtAssociateTag.wallet = newAssociateWallet._id;

    // SAVES AND ERROR CONTROLS
    //USER
    const savedUser = await newUser.save();
    if (!savedUser) throw new Error("No USER was saved creating a NEW USER ❌");
    //WALLET
    const savedWallet = await newAssociateWallet.save();
    if (!savedWallet)
      throw new Error("No WALLET was saved creating a NEW USER ❌");
    //ACCOUNT
    const savedAccount = await newAssociateAccount.save();
    if (!savedAccount)
      throw new Error("No ACCOUNT was saved creating a NEW USER ❌");
    //BUDGET
    const savedBudget = await firstBudget.save();
    if (!savedBudget)
      throw new Error("No BUDGET was saved creating a NEW USER ❌");
    //TRANSACCTION
    const savedTransacction = await firstAssociateTransaction.save();
    if (!savedTransacction)
      throw new Error("No TRANSACTION was saved creating a NEW USER ❌");
    //CATEGORY
    const savedCategory = await fisrtAssociateCategory.save();
    if (!savedCategory)
      throw new Error("No CATEGORY was saved creating a NEW USER ❌");
    //SUB CATEGORY
    const savedSubCategory = await fisrtAssociateSubCategory.save();
    if (!savedSubCategory)
      throw new Error("No SUB-CATEGORY was saved creating a NEW USER ❌");
    //TAG
    const savedTag = await fisrtAssociateTag.save();
    if (!savedTag) throw new Error("No TAG was saved creating a NEW USER ❌");

    // console.log(savedUser);
    // console.log(savedWallet);
    // console.log(savedAccount);
    // console.log(savedTransacction);
    // console.log(savedCategory);
    // console.log(savedSubCategory);
    // console.log(savedTag);
    return NextResponse.json({
      data: savedUser,
      message: `New user "${savedUser.fullName}" was created successfully`,
      userCreatedStatus: true,
      status: 201,
    });
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
}
