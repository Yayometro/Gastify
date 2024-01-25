
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW CATEGORY")
        const {
            id,
        } = await request.json()
        await dbConnection();
        const removeSub = await SubCategory.findByIdAndDelete(id);
        //UPDATE
        if(!removeSub) throw new Error(`${removeSub.name} not removed 🤕`)
        return NextResponse.json({
            message: `${removeSub.name} was removed successfully 🤓`,
            data: removeSub,
            ok: true,
            status: 201
        })
    } catch(e){
        throw new Error(e)
    }
}
