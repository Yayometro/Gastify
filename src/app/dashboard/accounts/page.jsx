


import AccountClient from '@/components/multiUsedComp/AccountClient'
import { headers } from "next/headers";
import { auth } from "@/lib/auth/betterAuth";
import { redirect } from "next/navigation";
import React from 'react'

export const dynamic = 'force-dynamic';

async function page() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  // console.log(sesion)
  if (!sesion || !sesion.user?.email) redirect("/login");
  
  return (
    <div className='w-full h-full min-[768px]:pl-[80px]'>
      <AccountClient acSession={sesion.user.email}/>
    </div>
  )
}

export default page