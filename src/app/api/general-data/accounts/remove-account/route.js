
import Account from "@/model/Account";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on REMOVE-ACCOUNT POST") 
        const accountId = await request.json()
        await dbConnection();
        // FIND ACCOUNT
        const removedAccount = await Account.findByIdAndDelete(accountId)
            //IF ERROR
            if(!removedAccount) throw new Error(`No Account was identified to be removed`)

        return NextResponse.json({
            message: `${removedAccount.name} removed successfully 🤓`,
            data: removedAccount,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}