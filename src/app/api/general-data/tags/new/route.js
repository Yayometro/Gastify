
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Tag from "@/model/Tag";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW TAG")
        const {
            user,
            wallet,
            name,
            color,
        } = await request.json()
        if(!user) throw new Error("No USER received for NEW TAG")
        if(!wallet) throw new Error("No WALLET received for NEW TAG")
        await dbConnection();

        const newTag = new Tag({
            user,
            wallet,
            name: !name ? "write a name for this TAG 🤨" : name,
            color: !color ? null : color
        })
        const savedTag = await newTag.save();
        if(!savedTag) throw new Error("No new Tag was saved 🤕")
        return NextResponse.json({
            message: `${savedTag.name} was created successfully 🤓`,
            data: savedTag,
            ok: true,
            status: 201
        })
    } catch(e){
        throw new Error(e)
    }
}