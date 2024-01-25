
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category from "@/model/Category";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW CATEGORY")
        const {
            name,
            icon,
            color,
            user,
            wallet,
            accounts
        } = await request.json()
        if(!user) throw new Error("No USER received for NEW CATEGORY")
        if(!wallet) throw new Error("No WALLET received for NEW CATEGORY")
        await dbConnection();
        const newCategory = new Category({
            user: user,
            wallet: wallet,
            name: !name ? "write a name for this category 🤨" : name,
            icon: !icon ? null : icon,
            color: !color ? null : color
        })
        if(accounts.length > 0){
            accounts.map(acc => {
                newCategory.accounts.push(acc)
            })
        }
        const saveCatego = await newCategory.save()
        if(!saveCatego) throw new Error("New category not saved 🤕")
        return NextResponse.json({
            message: `${saveCatego.name} was created successfully 🤓`,
            data: saveCatego,
            ok: true,
            status: 201
        })
    } catch(e){
        throw new Error(e)
    }
}
