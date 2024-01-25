
import Account from "@/model/Account";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on NEW-ACCOUNT POST") 
        const {userId, walletId, name, amount, } = await request.json()
        await dbConnection();
        //
        const newAccount = new Account({
            user: userId,
            wallet: walletId,
            name: !name ? "Account nameless" : name,
            amount: !amount ? 0 : amount
        })
        const savedAccount = await newAccount.save();
            if(!savedAccount) throw new Error(`No Account: ${newAccount.name} was saved`)

        return NextResponse.json({
            message: `${newAccount.name} created successfully 🤓`,
            data: savedAccount,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}