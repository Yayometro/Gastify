"use client";

import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ReduxProvider from "@/lib/ReduxProvider";
import ThemeProvider from "./ThemeProvider";

/** Full application providers are kept off the public marketing/demo routes. */
export default function FullAppProviders({ children }: { children: React.ReactNode }) {
  return <AntdRegistry><ThemeProvider><ReduxProvider>{children}</ReduxProvider></ThemeProvider></AntdRegistry>;
}
