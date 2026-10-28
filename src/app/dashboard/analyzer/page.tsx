import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import WalletAnalyzer from "@/components/multiUsedComp/walletAnalyzer/WalletAnalyzer";
import GrowthOpportunityTeaser from "@/components/opportunities/GrowthOpportunityTeaser";

export const dynamic = "force-dynamic";

// The Wallet Analyzer on its own page (the dashboard keeps the month's summary and links here).
async function page(): Promise<React.JSX.Element> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion || !sesion.user?.email) redirect("/login");

  return (
    <div className="w-full h-full min-[768px]:pl-[80px]">
      <div className="flex flex-col gap-5">
        <GrowthOpportunityTeaser />
        <WalletAnalyzer mail={sesion.user.email} />
      </div>
    </div>
  );
}

export default page;
