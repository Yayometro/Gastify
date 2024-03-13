

import Dashboard from "@/components/Dashboard";
import React from 'react'
import { getServerSession } from "next-auth";
import fetcher from "@/helpers/fetcher";

async function DashboardPage() {
  const sesion = await getServerSession();
  // console.log(sesion)
  if (!sesion) throw new Error('No session on General Data Api Redux Middleware')
  if (!sesion.user.email) throw new Error('No email on session user in General Data Api Redux Middleware')
  const emailSession = sesion.user.email
  // const fetchTo = fetcher();
  // const data = await fetchTo.post("general-data", emailSession);
  // // console.log(data)
  // // ERRORS:
  // if (!data) return;
  // if (data.error) return console.log(user.error);
  // if (!data.ok) return console.log("No hay user", data.ok);
  // if (!data.data) return console.log("No data in response", data.data);
  // const fullData = data.data;

  return (
    <div className="w-full">
        <Dashboard session={emailSession}/>
    </div>
  )
}

export default DashboardPage