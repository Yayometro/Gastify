import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import { STEP_UP_TTL_MS } from "@/lib/auth/stepUpConfig";
import DashboardBackdrop from "@/components/multiUsedComp/DashboardBackdrop";
import Navbar from "@/components/Navbar";
import AllDataProvider from "@/components/Providers/AllDataProvider";
import ToolsFab from "@/components/multiUsedComp/ToolsFab";
import IdleStepUpGuard from "@/components/multiUsedComp/IdleStepUpGuard";
import HistoryLoadingPill from "@/components/multiUsedComp/loaders/HistoryLoadingPill";
import { I18nProvider } from "@/i18n/client";
import { currentLocale, messagesFor } from "@/i18n/server";
import { NAMESPACES } from "@gastify/core/i18n/catalogs";

// Every text the wallet's screens show: all the namespaces except the landing's and the phone's.
const WALLET_NAMESPACES = NAMESPACES.filter((namespace) => namespace !== "inicio" && namespace !== "mobile");

interface DashboardLayoutProps {
  children: React.ReactNode;
}

async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<React.JSX.Element> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  // Redirect, don't throw: middleware.js only checks that a session COOKIE
  // is present (cheap, spoofable-by-design - see its own comment), not that
  // it's still valid. A cookie that's stale/invalidated by the time this
  // authoritative check runs (mid sign-out, or after some other session
  // state change) used to throw here, which Next.js renders as a hard error
  // page instead of sending the visitor anywhere useful - exactly the kind
  // of stuck state that must instead just land on /login.
  if (!sesion || !sesion.user?.email) redirect("/login");

  // Step-up freshness gate - the authoritative half (see
  // src/lib/auth/stepUpConfig.js and IdleStepUpGuard.jsx for the client-
  // side proactive half). A valid, logged-in session alone isn't enough to
  // reach the Wallet: it also has to have proven a passkey/TOTP/backup-code
  // check within the last STEP_UP_TTL_MS, on every request - not just once
  // at login - so a device left open (or picked up by someone else) can't
  // sit unlocked indefinitely.
  const stepUpAt = sesion.session.stepUpVerifiedAt ? new Date(sesion.session.stepUpVerifiedAt).getTime() : 0;
  if (Date.now() - stepUpAt > STEP_UP_TTL_MS) {
    redirect("/verify-2fa");
  }

  // The language of the wallet and its texts: the screens below read them with useT() and useInfo().
  // The account's language (saved in the profile) wins over the device's choice and the country.
  const locale = await currentLocale(sesion.user.language, sesion.user.country);
  const messages = await messagesFor(locale, WALLET_NAMESPACES);

  return (
    <I18nProvider locale={locale} messages={messages}>
    <AllDataProvider>
    <IdleStepUpGuard />
    <HistoryLoadingPill />
    <div
      className={`dashboard-layer-container walllet-bg h-full w-full flex flex-col flex-nowrap sm:flex-row m-0 p-0`}
    >
      <DashboardBackdrop />
      <Navbar sesion={sesion} />
        {children}
        <ToolsFab mail={sesion.user.email} />
    </div>
    </AllDataProvider>
    </I18nProvider>
  );
}

export default DashboardLayout;
