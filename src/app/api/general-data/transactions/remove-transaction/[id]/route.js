
import dbConnection from "../../../../dbConnection"
import { NextResponse } from "next/server"
import Transaction from "@/model/Transaction"

export async function POST(request, {params}){
    try{
        if(!params) throw new Error("No params ID send to work on POST UPDATE TRANSACTION")
        // 
        await dbConnection();
        const removedTrans = await Transaction.findByIdAndDelete(params.id)
        if(!removedTrans) throw new Error("Transaction could not be removed ❌")
        console.log(removedTrans)
        return NextResponse.json({
            message: `Transaction ${removedTrans.name} was removed 🤓`,
            data: removedTrans,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}