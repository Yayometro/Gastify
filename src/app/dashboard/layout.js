import React from "react";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import AllDataProvider from "@/components/Providers/AllDataProvider";
import ToolsFab from "@/components/multiUsedComp/ToolsFab";

async function DashboardLayout({ children }) {
  const sesion = await getServerSession();
  // console.log(sesion)
  if (!sesion) throw new Error('No session on General Data Api Redux Middleware')
  if (!sesion.user.email) throw new Error('No email on session user in General Data')

  return (
    <AllDataProvider>
    <div
      className={`dashboard-layer-container walllet-bg h-full w-screen flex flex-col flex-nowrap sm:flex-row m-0 p-0`}
    >
      <Navbar sesion={sesion} />
        {children}
        <ToolsFab mail={sesion.user.email} />
    </div>
    </AllDataProvider>
  );
}

export default DashboardLayout;
