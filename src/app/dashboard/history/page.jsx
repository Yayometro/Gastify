import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import HistoryClient from "@/components/multiUsedComp/HistoryClient";

export const dynamic = "force-dynamic";

async function page() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion || !sesion.user?.email) redirect("/login");

  return (
    <div className=" w-full h-full min-[768px]:pl-[80px]">
      <HistoryClient email={sesion.user.email}/>
    </div>
  );
}

export default page;
