
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Tag from "@/model/Tag";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW TAG")
        const {
            id,
            name,
            color,
        } = await request.json()
        await dbConnection();

        const updatedTag = await Tag.findById(id);
        if(!updatedTag) throw new Error("No Tag was found 🤕")
        //UPDATE:
        updatedTag.name = !name ? updatedTag.name : name;
        updatedTag.color = !color ? updatedTag.color : color;
        //Saved
        const update = await updatedTag.save();
        if(!update) throw new Error("No new Tag was saved 🤕")
        return NextResponse.json({
            message: `${update.name} was updated successfully 🤓`,
            data: update,
            ok: true,
            status: 201
        })
    } catch(e){
        throw new Error(e)
    }
}