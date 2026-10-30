"use client";

import React from "react";
import type { InfoText } from "@gastify/core/info/createInfo";
import type { TourId } from "@gastify/core/tour/tourSteps";
import TutorialTip from "@/components/tour/TutorialTip";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";

export interface TitleWithHelpProps {
  // The visible title text. It is also the label of the compass when `tourLabel` is not given.
  title: string;
  // The explanation behind the "?" icon.
  info: InfoText;
  // A window with its own body (a guide with desplegables) shown behind the "?", instead of the plain text of `info`.
  body?: React.ReactNode;
  // The guided tour behind the compass. Without it, only the "?" is shown.
  tour?: TourId;
  tourLabel?: string;
  // Element used for the title text, so each place keeps its own heading level.
  as?: "span" | "p" | "h1" | "h2" | "h3";
  // Classes that style the title text only (size, weight, color, case).
  titleClassName?: string;
  // Classes for the whole row.
  className?: string;
  // Anchors the guided tours point at: on the row, and on the "?" and the compass wrappers.
  dataTour?: string;
  infoDataTour?: string;
  tourDataTour?: string;
}

// The pattern for every title that has help: the title, a vertical separator, then the "?" and the compass
// stuck together, in that order. Nothing else goes to the right of the title.
export default function TitleWithHelp({
  title,
  info,
  body,
  tour,
  tourLabel,
  as = "span",
  titleClassName = "",
  className = "",
  dataTour,
  infoDataTour,
  tourDataTour,
}: TitleWithHelpProps): React.JSX.Element {
  const Title = as;
  return (
    <div className={`flex items-center ${className}`} data-tour={dataTour}>
      <Title className={titleClassName}>{title}</Title>
      <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" />
      <span className="inline-flex items-center">
        <span data-tour={infoDataTour} className="inline-flex">
          <InfoTip info={info} body={body} />
        </span>
        {tour && (
          <span data-tour={tourDataTour} className="inline-flex">
            <TutorialTip tour={tour} label={tourLabel ?? title} />
          </span>
        )}
      </span>
    </div>
  );
}
