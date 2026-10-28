import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth, recordSessionActivity } from "@/lib/auth/betterAuth";
import { evaluateApiStepUp } from "@/lib/auth/stepUpPolicy";
import { isAdminEmail } from "@/lib/admin/adminAccess";

// The platform admin. Nothing here is indexed, and anyone who is not an admin gets the same 404 as a page that does not exist.
export const metadata: Metadata = { title: "Admin · Gastify", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user?.email) redirect("/login");
  // Not on the list: look like a missing page, and say nothing about /admin existing.
  if (!isAdminEmail(session.user.email)) notFound();

  // The same second-factor rule as the wallet (stepUpPolicy.ts): an admin who has not proved a second factor recently is sent to
  // the verification screen first.
  const stepUp = evaluateApiStepUp(session.session);
  if ("reason" in stepUp) redirect(`/verify-2fa?reason=${stepUp.reason}`);
  if (stepUp.shouldRecordActivity) await recordSessionActivity(session.session.token).catch(() => {});

  return (
    <div className="min-h-screen bg-[#150f26] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">Admin</span>
          <h1 className="text-xl font-extrabold">Gastify · Plataforma</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-violet-300 hover:text-white">
          ‹ Volver a Gastify
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">{children}</main>
    </div>
  );
}
