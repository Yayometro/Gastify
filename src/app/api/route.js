
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
        console.log('working')
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