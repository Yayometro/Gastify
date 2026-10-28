import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth, recordSessionActivity } from "@/lib/auth/betterAuth";
import { evaluateApiStepUp } from "@/lib/auth/stepUpPolicy";
import { isAdminEmail } from "@/lib/admin/adminAccess";
import DashboardBackdrop from "@/components/multiUsedComp/DashboardBackdrop";
import { AdminTabs, AdminWordmark } from "@/components/admin/AdminChrome";

// The platform admin. Nothing here is indexed; anyone who is not an admin gets the same 404 as a page that does not exist.
export const metadata: Metadata = { title: "Admin · Gastify", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user?.email) redirect("/login");
  // Not on the list: look like a missing page, and say nothing about /admin existing.
  if (!isAdminEmail(session.user.email)) notFound();

  // The same second-factor rule as the wallet (stepUpPolicy.ts): an admin who has not proved a second factor recently goes to the
  // verification screen first.
  const stepUp = evaluateApiStepUp(session.session);
  if ("reason" in stepUp) redirect(`/verify-2fa?reason=${stepUp.reason}`);
  if (stepUp.shouldRecordActivity) await recordSessionActivity(session.session.token).catch(() => {});

  return (
    <div className="walllet-bg relative min-h-screen w-full text-gf-text">
      <DashboardBackdrop />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AdminWordmark />
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-200">
              Plataforma
            </span>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-purple-300 hover:text-white">
            ‹ Volver a mi billetera
          </Link>
        </header>
        <AdminTabs />
        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
