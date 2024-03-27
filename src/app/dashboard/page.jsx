

import Dashboard from "@/components/Dashboard";
import React from 'react'
import { getServerSession } from "next-auth";
import fetcher from "@/helpers/fetcher";

export const dynamic = 'force-dynamic';

async function DashboardPage() {
  const sesion = await getServerSession();
  // console.log(sesion)
  if (!sesion) throw new Error('No session on General Data Api Redux Middleware')
  if (!sesion.user.email) throw new Error('No email on session user in General Data Api Redux Middleware')
  const emailSession = sesion.user.email

  return (
    <div className="w-full">
        <Dashboard session={emailSession}/>
    </div>
  )
}

export default DashboardPage