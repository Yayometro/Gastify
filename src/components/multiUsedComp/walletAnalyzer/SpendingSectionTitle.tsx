"use client";
import React from "react";
import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";
import type { TourId } from "@gastify/core/tour/tourSteps";

export interface SpendingSectionTitleProps {
  title: string;
  help: string;
  tour: TourId;
  variant: "card" | "modal";
}

// Gold pattern for a section title: the title, a vertical separator, then the
// "?" and the compass together. "card" matches the analyzer card headings;
// "modal" matches the small uppercase headings inside the detail window.
export default function SpendingSectionTitle({ title, help, tour, variant }: SpendingSectionTitleProps): React.JSX.Element {
  const titleClass = variant === "card" ? "text-[13px] font-bold text-gf-text" : "text-[11px] font-bold uppercase tracking-wide text-gf-text-muted";
  return <TitleWithHelp as="p" title={title} info={{ title, text: help }} tour={tour} titleClassName={titleClass} />;
}
