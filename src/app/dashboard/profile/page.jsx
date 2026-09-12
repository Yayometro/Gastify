

import ProfileClient from '@/components/ProfileClient'
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
    <div className='w-full h-full sm:pl-[80px]'>
      <ProfileClient pcSession={sesion.user.email}/>
    </div>
  )
}

export default page