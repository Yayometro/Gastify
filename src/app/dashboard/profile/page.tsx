import ProfileClient from "@/components/ProfileClient";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/betterAuth";
import { redirect } from "next/navigation";
import React from "react";
import { isAdminEmail } from "@/lib/admin/adminAccess";

export const dynamic = "force-dynamic";

async function page(): Promise<React.JSX.Element> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  // console.log(sesion)
  if (!sesion || !sesion.user?.email) redirect("/login");

  // Decided here, on the server, from the session and the ADMIN_EMAILS list. Only a boolean reaches the page: never the list.
  const isAdmin = isAdminEmail(sesion.user.email);

  return (
    <div className="w-full h-full sm:pl-[80px]">
      <ProfileClient pcSession={sesion.user.email} isAdmin={isAdmin} />
    </div>
  );
}

export default page;
