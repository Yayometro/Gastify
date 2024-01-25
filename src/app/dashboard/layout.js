import React from "react";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";

async function DashboardLayout({ children }) {
  const sesion = await getServerSession();
  console.log(sesion)
  if (!sesion) throw new Error('No session on General Data Api Redux Middleware')
  if (!sesion.user.email) throw new Error('No email on session user in General Data Api Redux Middleware')
   
  return (
    <div
      className={`dashboard-layer-container walllet-bg min-h-screen w-screen flex flex-col flex-nowrap sm:flex-row m-0 p-0`}
    >
      <Navbar sesion={sesion} />
      {children}
    </div>
  );
}

export default DashboardLayout;
