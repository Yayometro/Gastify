import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import GoalsClient from "@/components/goals/GoalsClient";

export const dynamic = "force-dynamic";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) redirect("/login");
  const { id } = await params;
  return <div className="w-full min-[768px]:pl-[80px]"><GoalsClient initialGoalId={id} /></div>;
}
