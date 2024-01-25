
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Tag from "@/model/Tag";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW TAG")
        const {
            id
        } = await request.json()
        await dbConnection();

        const removedTag = await Tag.findByIdAndDelete(id);
        if(!removedTag) throw new Error("No Tag was removed 🤕")
        return NextResponse.json({
            message: `${removedTag.name} was removed successfully 🤓`,
            data: removedTag,
            ok: true,
            status: 201
        })
    } catch(e){
        throw new Error(e)
    }
}