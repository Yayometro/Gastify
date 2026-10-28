"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useThemeMode } from "@/app/ThemeProvider";
import { Tabs } from "./AdminUi";

// The Gastify wordmark for the admin header: white on the dark theme, black on the light one (the same files the wallet uses).
export function AdminWordmark(): React.JSX.Element {
  const { mode } = useThemeMode();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mode === "dark" ? "/brand/gastify-wordmark-white.svg" : "/brand/gastify-wordmark-black.svg"}
      alt="Gastify"
      className="h-8 w-auto"
    />
  );
}

const SECTIONS = [
  { href: "/admin", label: "Resumen", match: (path: string) => path === "/admin" },
  { href: "/admin/rendimiento", label: "Rendimiento", match: (path: string) => path.startsWith("/admin/rendimiento") },
  { href: "/admin/ingresos", label: "Ingresos", match: (path: string) => path.startsWith("/admin/ingresos") },
  { href: "/admin/auditoria", label: "Auditoría", match: (path: string) => path.startsWith("/admin/auditoria") || path.startsWith("/admin/usuarios") },
];

export function AdminTabs(): React.JSX.Element {
  const path = usePathname() ?? "/admin";
  return <Tabs items={SECTIONS.map((section) => ({ href: section.href, label: section.label, active: section.match(path) }))} />;
}
