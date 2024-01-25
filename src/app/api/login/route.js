

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnection from "../dbConnection";
import bcryptjs from 'bcryptjs'

import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import Tag from "@/model/Tag";
import defCategoriesCreator from "../DefCategoriesCreator.js";




export async function GET(){
    try {
        console.log('Funciona el get de login')
        console.log('Funciona despues de Auth')
        const data = {
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

export async function POST(request){
    try{
        if(!request) return {error: "no data in request"}
        const dataRequest = await request.json()
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