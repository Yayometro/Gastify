"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import React from "react";

const FullAppProviders = dynamic(() => import("./FullAppProviders"), { ssr: true });
const DemoAppProviders = dynamic(() => import("./demo/DemoAppProviders"), { ssr: true });

/** Keep public pages independent of the signed-in app's store and session side effects. */
export default function RouteProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") return <>{children}</>;
  if (pathname === "/demo" || pathname?.startsWith("/demo/")) {
    return <DemoAppProviders>{children}</DemoAppProviders>;
  }
  return <FullAppProviders>{children}</FullAppProviders>;
}
