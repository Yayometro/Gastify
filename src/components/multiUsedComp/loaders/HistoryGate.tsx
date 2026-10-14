"use client";

import React from "react";
import useHistoryReadyFor from "@/hooks/useHistoryReadyFor";

export interface HistoryGateProps {
  // Start of every period the section is showing (main period, compared period...).
  starts: (Date | string | number | null | undefined)[];
  children: React.ReactNode;
  className?: string;
}

// Covers a section with a "loading your older history" notice while the movements it
// needs have not arrived yet. The section stays mounted (so its date pickers keep
// working and nothing resets) and corrects itself when the history lands.
function HistoryGate({ starts, children, className }: HistoryGateProps): React.JSX.Element {
  const ready = useHistoryReadyFor(...starts);
  return (
    // The children stay direct children (callers rely on flex/gap layouts on this element);
    // the notice is absolutely positioned so it takes no space.
    <div className={`relative ${className || ""}`} aria-busy={!ready}>
      {children}
      {!ready && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-[5] flex items-start justify-center pt-16 pointer-events-none rounded-[inherit] bg-black/35 backdrop-blur-[1px]"
        >
          <p className="sticky top-24 rounded-full gf-glass-card px-4 py-2 text-xs sm:text-sm text-gf-text shadow-lg text-center max-w-[90%]">
            Cargando tus movimientos más antiguos… los números de este periodo se completarán solos.
          </p>
        </div>
      )}
    </div>
  );
}

export default HistoryGate;
