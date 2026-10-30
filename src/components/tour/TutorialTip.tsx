"use client";

import React from "react";
import { IoCompassOutline } from "react-icons/io5";
import type { TourId } from "@gastify/core/tour/tourSteps";
import { useT } from "@/i18n/client";
import { useTour } from "./TourProvider";

// The compass next to a title: it starts the tutorial of that page or of that section. The question mark explains what a number means;
// this one shows, step by step, how to use the section. A bare icon (no circle), the same size as the question mark beside it, so the
// two read as one pair. The welcome and every page tour teach both.
// It may sit inside a card that opens something when pressed: the click never reaches that card.
export default function TutorialTip({ tour: id, label, className = "", size = 20 }: { tour: TourId; label: string; className?: string; size?: number }): React.JSX.Element | null {
  const t = useT();
  const tour = useTour();
  if (!tour.available) return null;
  const text = t("tour.tip.label", { p1: label });
  return (
    <button
      type="button"
      data-tour="tutorial-tip"
      aria-label={text}
      title={text}
      onClick={(event) => {
        event.stopPropagation();
        tour.startTour(id);
      }}
      className={`inline-flex shrink-0 items-center justify-center align-middle rounded-full text-purple-200 transition-colors hover:text-gf-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300 ${className}`}
    >
      <IoCompassOutline size={size} aria-hidden="true" />
    </button>
  );
}
