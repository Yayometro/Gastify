
import React from 'react'
import LoginComponent from '@/components/LoginComponent'
//
import { getServerSession } from 'next-auth'
import {redirect} from 'next/navigation'
import { authOptions } from "../api/auth/[...nextauth]/route";

async function Login() {
    const session = await getServerSession(authOptions); //If user logged then redirect
    if(session) redirect("/dashboard")
  return (
    <div className='bg-slate-100 p-4 w-screen h-screen flex justify-center items-center Class
    Properties
    bg-origin-border bg-center' style={{backgroundImage: "url('/infoTwo.jpg')"}}>
        <LoginComponent />
    </div>
  )
}

export default Login