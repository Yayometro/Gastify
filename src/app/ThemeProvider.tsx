"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";
import { ToastContainer } from "react-toastify";

export type ThemeMode = "dark" | "light";

export interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

export interface ThemeProviderProps {
  children?: React.ReactNode;
}

// layout.js is a Server Component (it awaits getServerSession()), and
// antd's ConfigProvider is a client-only component - importing it there
// directly breaks the RSC bundler ("Could not find module ... in the React
// Client Manifest"). This thin client wrapper is the boundary: layout.js
// only ever imports THIS component, never antd directly.
//
// Dark is the default theme, but the sidebar toggle can flip to light -
// this context is how that choice reaches antd's algorithm, the toast
// theme, and the sidebar button itself. The gf-* CSS tokens (globals.css)
// react on their own via the [data-theme] attribute this sets on <html>;
// components with their own local ConfigProvider only override
// colorPrimary/borderRadius, so they inherit this algorithm from here
// automatically.
const ThemeModeContext = createContext<ThemeModeContextValue>({ mode: "dark", toggleMode: () => {} });

export const useThemeMode = (): ThemeModeContextValue => useContext(ThemeModeContext);

const STORAGE_KEY = "gf-theme";

export default function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const [mode, setMode] = useState<ThemeMode>("dark");

  // The blocking inline script in layout.js already set data-theme on
  // <html> before paint (avoiding a flash) - this just brings React's own
  // state in sync with whatever it decided, so the toggle button and
  // antd's algorithm start correct too.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light") setMode("light");
  }, []);

  const toggleMode = (): void => {
    setMode((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  };

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ConfigProvider
        theme={{
          algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: "#9700FF",
            colorBgContainer: "var(--gf-surface)",
            borderRadius: 16,
          },
        }}
      >
        {children}
      </ConfigProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={mode}
      />
    </ThemeModeContext.Provider>
  );
}
