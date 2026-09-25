
import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export async function POST(request){
    try{
        if(!request) throw new Error("No request received from NEW CATEGORY")
        const id = await request.json()
        // Security fix: this used to delete the SubCategory by id alone,
        // with zero ownership check - this endpoint isn't covered by
        // middleware.ts's matcher, so any caller could delete any other
        // user's sub-category. Now deletion is scoped to the caller's own
        // wallet (session-derived).
        const sesion = await auth.api.getSession({ headers: request.headers });
        if (!sesion) throw new Error("No session");
        await dbConnection();
        const userFound = await User.findOne({ mail: sesion.user.email }).lean();
        if (!userFound) throw new Error("User not found on REMOVE SUB-CATEGORY");
        const removeSub = await SubCategory.findOneAndDelete({ _id: id, wallet: userFound.wallet }).lean();

        //UPDATE
        if(!removeSub) throw new Error(`${removeSub.name || 'SubCategory'} not removed 🤕`)
        return NextResponse.json({
            message: `${removeSub.name || 'Sub-Category'} was removed successfully 🤓`,
            data: removeSub,
            ok: true,
            status: 201
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}
