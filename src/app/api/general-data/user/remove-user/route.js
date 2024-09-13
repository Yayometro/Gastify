import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on REMOVE USER")
        const {mail} = await request.json()
        await dbConnection();
        const removedUser = await User.findOneAndDelete({mail});
            if(!removedUser) throw new Error(`User not removed, please verify the email`);
        const removeWalletAssociated = await Wallet.findOneAndDelete({user: removedUser._id});
            if(!removeWalletAssociated) throw new Error(`Wallet not removed, please verify the email`);
        const removedAccount = await Account.deleteMany({user: removedUser._id});
            if(!removedAccount) throw new Error("Accounts not removed, please verify the email");
        const removeTransactions = await Transaction.deleteMany({user: removedUser._id})
            if(!removeTransactions) throw new Error("Transactions not removed, please verify the email");
        const removeCategories = await Category.deleteMany({user: removedUser._id})
            if(!removeCategories) throw new Error("Category not removed, please verify the email");
        const removeSubCategories = await SubCategory.deleteMany({user: removedUser._id})
            if(!removeSubCategories) throw new Error("SubCategories not removed, please verify the email");
        const removeTags = await Tag.deleteMany({user: removedUser._id})
            if(!removeTags) throw new Error("Tags not removed, please verify the email");
        //
        return NextResponse.json({
            data: removedUser,
            message: `${removedUser.name} removed successfully 🤓`,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}