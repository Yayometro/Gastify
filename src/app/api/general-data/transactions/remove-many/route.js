import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import Transaction from "@/model/Transaction";


export async function POST(request){
    try{
        if(!request) throw new Error("No request info ID send to work on REMOVE MANY TRANSACTION");

        let {manyTrans} = await request.json();
        console.log(manyTrans)
        await dbConnection();
        
        // Eliminar todas las transacciones cuyos IDs estén en el array manyTrans
        const result = await Transaction.deleteMany({ _id: { $in: manyTrans } });
        console.log(result)
        if(!result) throw new Error("Something went wrong trying to delete multiple transactions");
        return NextResponse.json({
            message: `"${result.deletedCount}" transactions removed successfully`,
            deletedCount: result.deletedCount, 
            status: 200,
            ok: true
        });
    } catch(e){
        console.log(e);
        return NextResponse.json({ error: e.message, status: 500, ok: false });
    }
}