
import RegisterComp from "@/components/RegisterComp";

// For auth
import { getServerSession } from "next-auth";
import {redirect} from 'next/navigation'
import { authOptions } from "../api/auth/[...nextauth]/route";

import React from 'react'

export default async function Register() {
    //
    const session = await getServerSession(authOptions); //If user logged then redirect
    if(session) redirect("/dashboard")
  return (
    <div className='bg-gf-bg p-4 w-full h-screen flex justify-center items-center bg-origin-border bg-center' style={{backgroundImage: "url('/infoOne.jpg')"}}>
        <RegisterComp />
    </div>
  )
}
