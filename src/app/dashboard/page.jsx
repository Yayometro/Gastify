

import Dashboard from "@/components/Dashboard";
import React from 'react'
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import fetcher from "@/helpers/fetcher";

export const dynamic = 'force-dynamic';

async function DashboardPage() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  // dashboard/layout.js already redirects to /login before this page ever
  // renders, so this is defense in depth, not the primary guard - but it
  // should fail the same way that one does (redirect, not throw) rather
  // than a raw error page if it's ever somehow reached without a session.
  if (!sesion || !sesion.user?.email) redirect("/login");
  const emailSession = sesion.user.email

  return (
    <div className="w-full">
        <Dashboard session={emailSession}/>
    </div>
  )
}

export default DashboardPage