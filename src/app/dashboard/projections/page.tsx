import React from "react";
import ProjectionsClient from "@/components/multiUsedComp/Projections/ProjectionsClient";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/betterAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function page(): Promise<React.JSX.Element> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion || !sesion.user?.email) redirect("/login");

  return (
    <div className=" w-full h-full min-[768px]:pl-[80px]">
      <ProjectionsClient mcSession={sesion.user.email} />
    </div>
  );
}

export default page;
