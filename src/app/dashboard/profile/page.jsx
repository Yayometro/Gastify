

import ProfileClient from '@/components/ProfileClient'
import { getServerSession } from 'next-auth';
import React from 'react'

async function page() {
  const sesion = await getServerSession();
  // console.log(sesion)
  if (!sesion) throw new Error('No session on General Data Api Redux Middleware')
  if (!sesion.user.email) throw new Error('No email on session user in General Data')
  
  return (
    <div className='w-full h-full sm:pl-[80px]'>
      <ProfileClient pcSession={sesion.user.email}/>
    </div>
  )
}

export default page