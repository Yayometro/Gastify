
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category from "@/model/Category";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW CATEGORY")
        const {
            id,
            name,
            icon,
            color,
            accounts
        } = await request.json()
        // console.log(
        //     id,
        //     name,
        //     icon,
        //     color,
        //     accounts
        // )
        await dbConnection();
        const findCatego = await Category.findById(id);
        if(!findCatego) throw new Error("No category found to UPDATE")
        // UPDATE
        findCatego.name = !name ? findCatego.name : name,
        findCatego.icon = !icon ? findCatego.icon : icon,
        findCatego.color = !color ? findCatego.color : color;
        if(accounts){
            if(accounts.length > 0){
                accounts.map(acc => {
                    findCatego.accounts.push(acc)
                })
            }
        }
        const saveCatego = await findCatego.save()
        if(!saveCatego) throw new Error(`${saveCatego.name} not saved 🤕`)
        return NextResponse.json({
            message: `${saveCatego.name} was created successfully 🤓`,
            data: saveCatego,
            ok: true,
            status: 201
        })
    } catch(e){
        // console.log(e)
        throw new Error(e)
    }
}
