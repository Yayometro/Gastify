"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { DEMO_HISTORICAL_BUDGETS, DEMO_PROJECTION_BASELINE, DEMO_RATES_TO_MXN } from "@/lib/demo/demoData";
import DemoFeatureGuide from "@/components/demo/DemoFeatureGuide";
import DemoBudgetComparisonCard from "@/components/demo/DemoBudgetComparisonCard";

const Dashboard = dynamic(() => import("@/components/Dashboard"));
const ProfileClient = dynamic(() => import("@/components/ProfileClient"));
const MovementsClient = dynamic(() => import("@/components/multiUsedComp/MovementsClient"));
const BudgetsClient = dynamic(() => import("@/components/multiUsedComp/Budgets/BudgetsClient"));
const AccountClient = dynamic(() => import("@/components/multiUsedComp/AccountClient"));
const CategoriesClient = dynamic(() => import("@/components/multiUsedComp/CategoriesClient"));
const WalletAnalyzer = dynamic(() => import("@/components/multiUsedComp/walletAnalyzer/WalletAnalyzer"));
const HistoryClient = dynamic(() => import("@/components/multiUsedComp/HistoryClient"));
const ProjectionsClient = dynamic(() => import("@/components/multiUsedComp/Projections/ProjectionsClient"));

export type DemoSection = "dashboard" | "profile" | "movements" | "budgets" | "projections" | "analyzer" | "accounts" | "history" | "categories";

function DemoLoading(): React.JSX.Element {
  return <div className="demo-loading" role="status"><span className="demo-loading-mark">G</span>Preparando vista de ejemplo…</div>;
}

function DemoPageFrame({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="demo-section-screen w-full min-h-[calc(100vh-50px)] px-3 pt-3 pb-24 sm:px-5 md:pl-[96px] md:pr-5">{children}</div>;
}

export default function DemoWorkspace({ section }: { section: DemoSection }): React.JSX.Element {
  if (section === "dashboard") return <Dashboard readOnly demoRatesToMxn={DEMO_RATES_TO_MXN} />;

  let content: ReactNode;
  switch (section) {
    case "profile":
      content = <ProfileClient readOnly />;
      break;
    case "movements":
      content = <MovementsClient readOnly />;
      break;
    case "budgets":
      content = <BudgetsClient readOnly />;
      break;
    case "projections":
      content = <ProjectionsClient readOnly demoRatesToMxn={DEMO_RATES_TO_MXN} demoProjectionBaseline={DEMO_PROJECTION_BASELINE} />;
      break;
    case "analyzer":
      content = <div className="flex flex-col gap-5"><WalletAnalyzer demoRatesToMxn={DEMO_RATES_TO_MXN} /><DemoBudgetComparisonCard context="analyzer" /></div>;
      break;
    case "accounts":
      content = <AccountClient readOnly />;
      break;
    case "history":
      content = <HistoryClient readOnly email={null} demoBudgets={DEMO_HISTORICAL_BUDGETS} demoRatesToMxn={DEMO_RATES_TO_MXN} />;
      break;
    case "categories":
      content = <CategoriesClient readOnly />;
      break;
    default: {
      const _exhaustiveCheck: never = section;
      return _exhaustiveCheck;
    }
  }

  return <DemoPageFrame>
    <DemoFeatureGuide section={section} />
    {content}
  </DemoPageFrame>;
}

export { DemoLoading };
