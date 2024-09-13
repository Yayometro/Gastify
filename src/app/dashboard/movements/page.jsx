
import MovementsClient from '@/components/multiUsedComp/MovementsClient'
import React from 'react'
import fetcher from '@/helpers/fetcher'
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';

async function page() {
  const sesion = await getServerSession();
  // console.log(sesion)
  if (!sesion) throw new Error('No session on General Data Api Redux Middleware')
  if (!sesion.user.email) throw new Error('No email on session user in General Data')
  
  
  return (
    <div className=' w-full h-full min-[768px]:pl-[80px]'>
        <MovementsClient mcSession={sesion.user.email}/>
    </div>
  )
}

export default page