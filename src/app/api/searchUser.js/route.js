
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnection from "../dbConnection";
import bcryptjs from 'bcryptjs'

import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";

// NOTE (TypeScript migration, Fase 0): this file lives inside app/api/, so
// Next.js's route-type checker (only active once tsconfig.json exists)
// requires every export here to be a valid route handler (GET/POST/etc.).
// `searchForUserDb` never was one - it's dead code (confirmed zero imports
// anywhere in the repo) that also references an undefined `contraseña`
// variable, so it would throw if ever called. De-exporting it unblocks the
// build without deleting anything - a file delete was blocked by the auto
// mode classifier as irreversible; ask the user if they want it removed.
const searchForUserDb = async (request) => {
   try { 
    if(!request) throw new Error("No data in request on GENERAL-DATA POST") 
    const {mail} = await request.json()
    await dbConnection();
    const userFound = await User.findOne({mail});
    if(!userFound) throw new Error("User not found");
    const matchPass = await bcryptjs.compare(contraseña, userFound.password)
    
    if(!matchPass) throw new Error("Password incorrect");
    userFound.password = "";
    
    return userFound
    } catch(e){
        throw new Error("Something went grong in searchForUserDb")
    }
}

