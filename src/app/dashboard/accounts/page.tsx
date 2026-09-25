import React from "react";
import AccountClient from "@/components/multiUsedComp/AccountClient";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/betterAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function page(): Promise<React.JSX.Element> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  // console.log(sesion)
  if (!sesion || !sesion.user?.email) redirect("/login");

  return (
    <div className="w-full h-full min-[768px]:pl-[80px]">
      <AccountClient acSession={sesion.user.email} />
    </div>
  );
}

export default page;