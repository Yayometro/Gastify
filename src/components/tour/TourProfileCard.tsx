"use client";

import React, { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { ProfileCard, PrimaryButton } from "@/components/profile/ProfileParts";
import { callOnboarding } from "./tourApi";
import { useTour } from "./TourProvider";

// The profile's Tutorial card: the way back to the full tour, and to the welcome, for anyone, however long they have used Gastify.
// While the tutorial still offers itself on its own (a new account's first sessions), it also lets the person turn that off.
export default function TourProfileCard(): React.JSX.Element | null {
  const t = useT();
  const tour = useTour();
  const [offersItself, setOffersItself] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (!tour.remembers) return;
    let alive = true;
    void callOnboarding({ action: "state" }).then((reply) => {
      if (alive && reply?.onboarding?.tutorial === "pending") setOffersItself(true);
    });
    return () => {
      alive = false;
    };
  }, [tour.remembers]);

  const stop = () => {
    setOffersItself(false);
    setStopped(true);
    void callOnboarding({ action: "dismiss" });
  };

  if (!tour.available) return null;
  return (
    <ProfileCard title={t("tour.profileCard.title")} tour="prof-tutorial">
      <p className="text-sm text-gf-text-muted">{t("tour.profileCard.text")}</p>
      <div className="flex flex-wrap gap-3">
        <PrimaryButton label={t("tour.profileCard.full")} onClick={tour.startFull} />
        <button
          type="button"
          onClick={tour.openMenu}
          className="gf-glass-card rounded-full px-5 py-3 text-sm font-semibold text-gf-text hover:brightness-125"
        >
          {t("tour.profileCard.menu")}
        </button>
        <button
          type="button"
          onClick={() => tour.startTour("intro")}
          className="gf-glass-card rounded-full px-5 py-3 text-sm font-semibold text-gf-text hover:brightness-125"
        >
          {t("tour.profileCard.basics")}
        </button>
      </div>
      {offersItself && (
        <button type="button" onClick={stop} className="self-start text-xs text-gf-text-muted underline-offset-2 hover:text-gf-text hover:underline">
          {t("tour.profileCard.stop")}
        </button>
      )}
      {stopped && <p role="status" className="text-xs text-gf-text-muted">{t("tour.profileCard.stopped")}</p>}
    </ProfileCard>
  );
}
