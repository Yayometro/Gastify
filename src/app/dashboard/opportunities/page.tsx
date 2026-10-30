import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import OpportunitiesClient from "@/components/opportunities/OpportunitiesClient";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage(): Promise<React.JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) redirect("/login");
  return <div className="w-full min-[768px]:pl-[80px]"><OpportunitiesClient /></div>;
}
