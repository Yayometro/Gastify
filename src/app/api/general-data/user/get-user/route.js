

import dbConnection from "../../../dbConnection"
import { NextResponse } from "next/server"
import User from "@/model/User"

export async function POST(request){
    try{   
        // console.log(request)
        if(!request) throw new Error("No data in request on GENERAL-DATA POST") 
        const mail = await request.json()
        // console.log(mail)
        //
        await dbConnection()
        let userFounded = await User.findOne({mail}).lean()
        if(!userFounded) throw new Error({error: "User not found, review the email provided in GENERAL-DATA POST"});
        userFounded.password = ''
        // console.log(userFounded)
        return NextResponse.json({
            message: `User founded`,
            data: userFounded,
            status: 201,
            ok: true
        })
    } catch (e){
        console.log(e)
        throw new Error(e)
    }
}