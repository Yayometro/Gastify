import { NextResponse, type NextRequest } from "next/server";
import type mongoose from "mongoose";
import dbConnection from "../dbConnection";

import User, { type IUser } from "@/model/User";
import "@/model/Wallet";
import "@/model/Account";
import "@/model/Transaction";
import "@/model/Category";
import "@/model/Tag";
// import bcryptjs from 'bcryptjs'
// import defCategoriesCreator from "../defCategoriesCreator.js";

export interface LoginGetResponse {
    message: string;
    status: number;
    successData: boolean;
}

export interface LoginPostSuccessResponse {
    data: mongoose.FlattenMaps<IUser> | null;
    message: string;
    status: number;
    ok: boolean;
}

export interface LoginPostErrorResponse {
    error: string;
}

export type LoginPostResponse = LoginPostSuccessResponse | LoginPostErrorResponse;

export async function GET(): Promise<NextResponse<LoginGetResponse>> {
    try {
        console.log('Funciona el get de login')
        console.log('Funciona despues de Auth')
        const data: LoginGetResponse = {
            message: "Usuario encontrado",
            status: 201,
            successData: true
        }
        return NextResponse.json(data)
    } catch(e){
        console.log({error: e, status: 500})
        throw new Error(e)
    }
}

export async function POST(
    request: NextRequest | Request
): Promise<NextResponse<LoginPostResponse>> {
    try{
        if(!request) return NextResponse.json({error: "no data in request"}, {status: 400})
        const dataRequest: string = await request.json()
        console.log(dataRequest)
        await dbConnection()
        // // Check DEF CARTEGORIES:
        // const isDefCategories = await defCategoriesCreator()
        // if(!isDefCategories) throw new Error("Some issue while runing defCategoriesCreator function")
        //FIND USER
        const userFound = await User.findOne({mail: dataRequest}).lean()
        userFound.password = ""
        console.log(userFound)
        if(!userFound) throw new Error("User not found");
        console.log(userFound)

    
        
        console.log('Usuario encontrado')
        return NextResponse.json({
            data: userFound,
            message: "User found",
            status: 201,
            ok: true
        })

    } catch(e){
        throw new Error(e)
    }
}


// .populate({
            //     path: "wallet",
            //     populate: [
            //         {
            //             path: "accounts",
            //             populate: [
            //                 {
            //                     path: "tags",
            //                     // match: { Tag: { $exists: true } }
            //                 },
            //                 {
            //                     path: "categories",
            //                 }
            //             ]
            //         },
            //         {
            //             path: "categories",
            //         },
            //         {
            //             path: "tags",
            //         },
            //         {
            //             path: "transactions",
            //         },
                    // {
                    //     path: "budget.budgetsCollection.category",
                    // },
                    // {
                    //     path: "individualBudget",
                    //     populate: [
                    //         {
                    //         path: "category",
                    //         },
                    //         // {
                    //         //     path: "tags",
                    //         //     match: { tags: { $exists: true } }
                    //         // },
                    //     ],// Poblar solo si el campo tags existe
                    // },
                    // {
                    //     path: "transactions",
                    //     populate: [
                    //         {
                    //         path: "accounts",
                    //         select: "name"
                    //         },
                    //         // {
                    //         //     path: "tags",
                    //         //     match: { tags: { $exists: true } }
                    //         // },
                    //     ],// Poblar solo si el campo tags existe
                    // },
            //     ]
            // })