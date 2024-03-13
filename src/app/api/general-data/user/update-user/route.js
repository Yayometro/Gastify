
import dbConnection from "../../../dbConnection"
import { NextResponse } from "next/server"
import User from "@/model/User"
import bcryptjs from 'bcryptjs'
// export async function POST(request){
//     try{

//     } catch (e){
//     }
// }

export async function GET(){
    try{
        return NextResponse.json({
            message: "Data founded",
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}

export async function POST(request){
    try{    
        if(!request) throw new Error("No data in request on GENERAL-DATA POST") 
        const dataRequest = await request.json()
        console.log(dataRequest)
        //Password check
        let encryptPassword;
        if(dataRequest.password){
            console.log(dataRequest.password)
            const salt = await bcryptjs.genSalt(10)
            encryptPassword = await bcryptjs.hash(dataRequest.password, salt)
        }
        console.log(encryptPassword)
        let parsedPhone
        if(typeof dataRequest.phone === "string"){
            console.log(dataRequest.phone)
            parsedPhone = Number(dataRequest.phone)
        }
        console.log(parsedPhone)
        await dbConnection()
        let userFounded = await User.findOne({mail: dataRequest.mail}).lean()
        if(!userFounded) throw new Error({error: "User not found, review the email provided in GENERAL-DATA POST"});

        // const userUpdated = await userFounded.save();
        const userUpdated = await User.findOneAndUpdate(
            { mail: userFounded.mail },
            {
              $set: {
                fullName: dataRequest.fullName || userFounded.fullName,
                mail: dataRequest.mail || userFounded.mail,
                password: encryptPassword || userFounded.password,
                image: dataRequest.image || userFounded.image,
                phone: parsedPhone || userFounded.phone,
              }
            },
            { new: true } // Devuelve el documento modificado
          );
      
          if (!userUpdated) {
            throw new Error({ error: "User not found, review the email provided in GENERAL-DATA POST" });
          }
        console.log(userFounded)
        return NextResponse.json({
            message: `User ${userFounded?.fullName || ""} was updated 🤓`,
            data: userUpdated,
            status: 201,
            ok: true
        })
    } catch (e){
        console.log(e)
        throw new Error(e)
    }
}