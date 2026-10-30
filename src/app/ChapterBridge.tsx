"use client";

import type { MouseEvent, ReactNode } from "react";

// The button at the end of a chapter that leads to the next one: it scrolls there (instantly if the person asked for less motion)
// and moves the focus to the chapter, so a keyboard or a screen reader continues from there, not from where the button was.
export default function ChapterBridge({ to, children }: { to: string; children: ReactNode }) {
  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(to);
    if (!target) return;
    event.preventDefault();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
    window.history.replaceState(null, "", `#${to}`);
  };
  return <a href={`#${to}`} className="home-bridge" onClick={go}>{children} <span aria-hidden="true">↓</span></a>;
}
