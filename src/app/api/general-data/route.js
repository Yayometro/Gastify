
import dbConnection from "../dbConnection";
import { NextResponse } from "next/server";

import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Budget from "@/model/Budget";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";

export async function GET(){
    try{
        return NextResponse.json({
            message: "Data founded",
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on GENERAL-DATA POST") 
        const dataRequest = await request.json()
        console.log(dataRequest)
        //CONNECTION
        await dbConnection()
        //FIND USER
        const userFound = await User.findOne({mail: dataRequest}).lean()
            if(!userFound) throw new Error({error: "User not found, review the email provided in GENERAL-DATA POST"});
            const userId = userFound._id;
            const walletId = userFound.wallet;
        //FIND WALLET
        const walletFound = await Wallet.findById(walletId).lean()
        //IF ERROR
        if(!walletFound) throw new Error("Wallet no found, review the wallet id on GENERAL-DATA POST");
        
        //FIND ACCOUNTS
        const accountsFounded = await Account.find({ user: userId, wallet: walletId }).lean()
            if(!accountsFounded) throw new Error("Accounts no found, review the user id on GENERAL-DATA POST");
        //FIND BUDGETS
        const budgetsFounded = await Budget.find({user: userId, wallet: walletId })
            .populate({
                path: "category",
            })
            .populate({
                path: "subCategory",
            })
            if(!budgetsFounded) throw new Error("No Budgets found, review the user and wallet id on GENERAL-DATA POST");
        //FIND TRANSACTIONS
        const transactionsFounded = await Transaction.find({ user: userId, wallet: walletId}).lean()
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
            })
            
            if(!transactionsFounded) throw new Error("No transactions found, review the user and wallet id on GENERAL-DATA POST");
            
        //FIND CATEGORIES
        const categoriesFounded = await Category.find({ user: userId, wallet: walletId}).lean()
            if(!categoriesFounded) throw new Error("No categories found, review the user and wallet id on GENERAL-DATA POST");
            
        //FIND DEFUALT CATEGORIES
        const defaultCategoriesFounded = await Category.find({ isDefaultCatego: true}).lean()
            if(!defaultCategoriesFounded) throw new Error("No default categories found, review the user and wallet id on GENERAL-DATA POST");
            
        //MIXING CATEGORIES
        const mixedCategories = categoriesFounded.concat(defaultCategoriesFounded)
            if(!mixedCategories) throw new Error("Mixing categories was wrong, review data in GENERAL-DATA POST");
        //FIND CATEGORIES
        const subCategoriesFounded = await SubCategory.find({ user: userId, wallet: walletId}).lean()
            .populate({
                path: "fatherCategory",
            })
            if(!subCategoriesFounded) throw new Error("No SubCategories found, review the user and wallet id on GENERAL-DATA POST");
            
        // FIND TAGS
        const tagsFounded = await Tag.find({ user: userId,  wallet: walletId}).lean()
            if(!tagsFounded) throw new Error("No Tags found, review the user and wallet id on GENERAL-DATA POST");
            
            
        const fullInfo = {
            user: userFound,
            wallet: walletFound,
            accounts: accountsFounded,
            budgets: budgetsFounded,
            transactions:transactionsFounded,
            categories: mixedCategories,
            subCategories: subCategoriesFounded,
            tags: tagsFounded,
        }
        return NextResponse.json({
            data: fullInfo,
            message: "Data founded",
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}
