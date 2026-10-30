"use client";

import React, { useEffect, useRef } from "react";
import { IoCompassOutline, IoSparklesOutline } from "react-icons/io5";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import { useT } from "@/i18n/client";

// The two things the tutorial offers on its own when a session opens (see packages/core/src/tour/onboarding.ts): to continue
// where the person left it, and, once, to tell an older account that the tutorial exists.

interface ResumeProps {
  onContinue: () => void;
  onRestart: () => void;
  onLater: () => void;
  onNever: () => void;
}

export function TourResumeDialog({ onContinue, onRestart, onLater, onNever }: ResumeProps): React.JSX.Element {
  const t = useT();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);

  // Focus goes into the dialog and back to where it was; Esc is "Not now"; Tab stays inside.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => firstRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onLater();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled)"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [onLater]);

  return (
    <BasicModal
      zIndexClass="z-[10010]"
      close={onLater}
      renderContent={
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gf-tour-resume-title"
          className="content absolute z-[10011] flex w-[94vw] max-w-[440px] flex-col gap-4 overflow-hidden rounded-3xl p-6 gf-glass-violet"
        >
          <header className="flex items-start gap-3">
            <IoCompassOutline size={28} className="mt-0.5 shrink-0 text-purple-300" aria-hidden="true" />
            <div>
              <h2 id="gf-tour-resume-title" className="text-xl font-bold text-gf-text">{t("tour.resume.title")}</h2>
              <p className="mt-1 text-sm text-purple-100/75">{t("tour.resume.text")}</p>
            </div>
          </header>
          <div className="flex flex-col gap-2.5">
            <button ref={firstRef} type="button" onClick={onContinue} className="gf-glass-button rounded-full px-5 py-3 text-sm font-semibold text-white">
              {t("tour.resume.continue")}
            </button>
            <button type="button" onClick={onRestart} className="gf-glass-card rounded-full px-5 py-3 text-sm font-semibold text-purple-100 hover:text-gf-text">
              {t("tour.resume.restart")}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <button type="button" onClick={onNever} className="text-purple-100/70 underline-offset-2 hover:text-gf-text hover:underline">
              {t("tour.resume.never")}
            </button>
            <button type="button" onClick={onLater} className="rounded-full px-4 py-1.5 font-semibold text-purple-100 hover:text-gf-text">
              {t("tour.resume.later")}
            </button>
          </div>
        </div>
      }
    />
  );
}

interface AnnounceProps {
  onStart: () => void;
  onDismiss: () => void;
}

// A small card in a corner, not a modal: an account that has used Gastify for a while is not interrupted.
export function TourAnnounce({ onStart, onDismiss }: AnnounceProps): React.JSX.Element {
  const t = useT();
  return (
    <aside
      role="status"
      className="gf-glass-violet fixed bottom-24 left-4 right-4 z-[900] flex max-w-sm flex-col gap-3 rounded-3xl p-4 shadow-2xl sm:right-auto md:bottom-6 md:left-24"
    >
      <div className="flex items-start gap-3">
        <IoSparklesOutline size={22} className="mt-0.5 shrink-0 text-purple-300" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-gf-text">{t("tour.announce.title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-purple-100/80">{t("tour.announce.text")}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onDismiss} className="rounded-full px-4 py-2 text-xs font-semibold text-purple-100 hover:text-gf-text">
          {t("tour.announce.dismiss")}
        </button>
        <button type="button" onClick={onStart} className="gf-glass-button rounded-full px-4 py-2 text-xs font-semibold text-white">
          {t("tour.announce.start")}
        </button>
      </div>
    </aside>
  );
}
