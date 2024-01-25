
import Account from "@/model/Account";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on UPDATE-ACCOUNT POST") 
        const {accountId, name, amount, } = await request.json()
        await dbConnection();
        // FIND ACCOUNT
        const findAccount = await Account.findById(accountId)
        //IF ERROR
            if(!findAccount) throw new Error(`No Account: ${name} was identified`)
        findAccount.name = !name ? findAccount.name : name,
        findAccount.amount = !amount ? findAccount.amount : amount
        const savedAccount = await findAccount.save();
        //IF ERROR
            if(!findAccount) throw new Error(`No Account: ${findAccount.name} was saved`)

        return NextResponse.json({
            message: `${savedAccount.name} updated successfully 🤓`,
            data: savedAccount,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}