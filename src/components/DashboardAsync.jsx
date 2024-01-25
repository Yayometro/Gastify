'use client'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { updateUser } from '@/lib/features/userSlice';
import fetcher from '@/helpers/fetcher';
import { signOut } from "next-auth/react"; 


async function DashboardAsync() {
  return (
    <div>
        <div>
        <h1>Dashboard</h1>
        <img src={session?.user?.image} alt="" />
        <p>{session?.user?.name}</p>
        <p>{session?.user?.email}</p>
        <button onClick={() => signOut()}>Sign Out</button>
    </div>
    </div>
  )
}

export default DashboardAsync