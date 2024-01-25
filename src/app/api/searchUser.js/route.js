
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnection from "../dbConnection";
import bcryptjs from 'bcryptjs'

import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";

export const searchForUserDb = async (request) => {
   try { 
    if(!request) throw new Error("No data in request on GENERAL-DATA POST") 
    const {mail} = await request.json()
    await dbConnection();
    // const userFound = await User.findOne({mail: info.mail});
    const userFound = await User.findOne({mail});
    if(!userFound) throw new Error("User not found");
    // const matchPass = await bcrypt.compare(credentials.password, userFound.password)
    const matchPass = await bcryptjs.compare(contraseña, userFound.password)
    console.log('Llego aqui')
    if(!matchPass) throw new Error("Password incorrect");
    userFound.password = "";
    console.log('Llego aqui')
    console.log(userFound)
    return userFound
    } catch(e){
        throw new Error("Something went grong in searchForUserDb")
    }
}

