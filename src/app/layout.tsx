import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/client";
import { currentLocale, messagesFor, serverT } from "@/i18n/server";
import RouteProviders from "./RouteProviders";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT(["common"]);
  return {
    title: "Gastify 💸",
    description: t("common.metaDescription"),
    applicationName: "Gastify",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Gastify",
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon: "/icon",
      apple: "/apple-icon",
    },
  };
}

// Runs before React hydrates, so the light theme (when previously chosen)
// paints on first frame instead of flashing dark-then-light. Dark needs no
// entry here since it's already the plain :root default in globals.css.
const themeInitScript = `(function(){try{var p=location.pathname;if(p!=="/"&&!p.startsWith("/demo")&&localStorage.getItem("gf-theme")==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`;

export interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // The language of this request, and the texts every page shares (the navigation, the common words). Each screen loads its
  // own namespace on top of these (see its layout).
  const locale = await currentLocale();
  const messages = await messagesFor(locale, ["common", "navbar", "auth", "shared"]);
  return (
    <html lang={locale}>
      <head>
        {/* Shaves the DNS/TLS handshake off the Google sign-in redirect -
            the browser opens the connection to Google's own domain ahead
            of time instead of only starting it the instant "Google" is
            clicked. Doesn't touch the actual OAuth round trip itself (that
            page navigation, and the human on the other end of it, is real,
            unavoidable latency no client-side change can remove), just the
            part before it. */}
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <I18nProvider locale={locale} messages={messages}>
          <RouteProviders><main>{children}</main></RouteProviders>
        </I18nProvider>
      </body>
    </html>
  );
}
