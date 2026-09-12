
import React from 'react'
import LoginComponent from '@/components/LoginComponent'
//
import { headers } from "next/headers";
import { auth } from "@/lib/auth/betterAuth";
import {redirect} from 'next/navigation'

async function Login() {
    const session = await auth.api.getSession({ headers: await headers() }); //If user logged then redirect
    if(session) redirect("/dashboard")
  return (
    <div className='bg-gf-bg p-4 w-full h-screen flex justify-center items-center bg-origin-border bg-center' style={{backgroundImage: "url('/infoOne.jpg')"}}>
        <LoginComponent />
    </div>
  )
}

export default Login