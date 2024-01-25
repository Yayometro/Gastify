
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW CATEGORY")
        const { id} = await request.json()
        console.log(id)
        await dbConnection();
        const removedCatego = await Category.findByIdAndDelete(id);
        if(!removedCatego) throw new Error("NO category REMOVED 🤕")
        //
        let deleteChildren = await SubCategory.deleteMany({fatherCategory: removedCatego._id})
        if(!deleteChildren) throw new Error(`No ALL childrens were removed from parent ${removedCatego.name}`)
        return NextResponse.json({
            message: `${removedCatego.name} was removed successfully 🤓`,
            data: {
                categoRemoved: removedCatego, 
                childrensDeleted: !deleteChildren ? null : deleteChildren
            },
            ok: true,
            status: 201
        })
    } catch(e){
        throw new Error(e)
    }
}
