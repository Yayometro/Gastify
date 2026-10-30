"use client";

import "driver.js/dist/driver.css";
import "./tour.css";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/i18n/client";
import { resumePoint, type ResumePoint } from "@gastify/core/tour/onboarding";
import { FULL_TOUR, pageForPath, type TourId } from "@gastify/core/tour/tourSteps";
import TourMenu from "./TourMenu";
import { TourAnnounce, TourResumeDialog } from "./TourOffers";
import { createTourEngine } from "./tourEngine";
import { callOnboarding } from "./tourApi";
import { clearRun } from "./tourRun";

export interface TourApi {
  // False when there is no provider above (a screen rendered on its own): the buttons that open the tutorial hide themselves.
  available: boolean;
  // True in the signed-in app, where the account remembers the tutorial (the demo keeps nothing).
  remembers: boolean;
  running: boolean;
  openMenu: () => void;
  startTour: (id: TourId) => void;
  startPage: () => void;
  startFull: () => void;
}

const UNAVAILABLE: TourApi = { available: false, remembers: false, running: false, openMenu: () => {}, startTour: () => {}, startPage: () => {}, startFull: () => {} };

const TourContext = createContext<TourApi>(UNAVAILABLE);

export function useTour(): TourApi {
  return useContext(TourContext);
}

// The first dashboard load of a browser tab tells the server that a session opened (the server counts each session once).
const VISIT_KEY = "gf-tour-visit";

type Offer = { kind: "resume"; point: ResumePoint } | { kind: "announce" } | null;

// The guided tutorial: a spotlight over one element at a time, a card that explains it, and a walk through the pages. The steps
// come from @gastify/core/tour (what each page points at), the texts from the "tour" namespace, the behavior from tourEngine.ts
// (driver.js draws the overlay and the card) and the look from tour.css. This component gives the engine what it needs from
// React (the language, the router, the path), the menu that opens from the Tutorial button and, in the signed-in app
// (`account`), what the account remembers: it opens the welcome by itself in the first sessions of a new account, offers to
// continue in the second, and tells an older account once that the tutorial exists.
export function TourProvider({ children, account = false }: { children: React.ReactNode; account?: boolean }): React.JSX.Element {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const page = pageForPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [offer, setOffer] = useState<Offer>(null);

  // The engine is built once; after every render it is handed the latest language, router and path.
  const host = {
    translate: t,
    pathname: () => pathname,
    navigate: (path: string) => router.push(path),
    onRunningChange: setRunning,
    onProgress: account ? (tour: TourId, step: string) => void callOnboarding({ action: "progress", tour, step }) : undefined,
    onComplete: account ? () => void callOnboarding({ action: "complete" }) : undefined,
  };
  const [engine] = useState(() => createTourEngine(host));
  useEffect(() => {
    engine.setHost(host);
  });

  useEffect(() => {
    engine.mount();
    return () => engine.unmount();
  }, [engine]);

  // A page the walk navigated to starts its tour when it loads; any tour left open on the old page ends.
  useEffect(() => {
    engine.onPathChange(pathname);
  }, [engine, pathname]);

  // A session opened: the server counts it once and says what to do by itself.
  useEffect(() => {
    if (!account) return;
    try {
      if (sessionStorage.getItem(VISIT_KEY)) return;
      sessionStorage.setItem(VISIT_KEY, "1");
    } catch {
      // Storage blocked: the server still counts a session only once, so asking again is harmless.
    }
    void callOnboarding({ action: "visit" }).then((reply) => {
      if (!reply || engine.isRunning()) return;
      if (reply.action === "welcome") {
        void engine.launch(["intro"], 0);
      } else if (reply.action === "resume") {
        const point = resumePoint(reply.onboarding?.progress);
        if (point) setOffer({ kind: "resume", point });
        else void engine.launch(["intro"], 0);
      } else if (reply.action === "announce") {
        setOffer({ kind: "announce" });
      }
    });
  }, [account, engine]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const startTour = useCallback(
    (id: TourId) => {
      setMenuOpen(false);
      clearRun();
      void engine.launch([id], 0);
    },
    [engine]
  );
  const startPage = useCallback(() => {
    if (page) startTour(page);
    else setMenuOpen(true);
  }, [page, startTour]);
  const startFull = useCallback(() => {
    setMenuOpen(false);
    clearRun();
    void engine.launch(FULL_TOUR, 0);
  }, [engine]);
  const startBasics = useCallback(() => startTour("intro"), [startTour]);

  const closeOffer = useCallback(() => setOffer(null), []);
  const continueTour = useCallback(() => {
    if (offer?.kind === "resume") engine.resume(offer.point);
    setOffer(null);
  }, [engine, offer]);
  const restartTour = useCallback(() => {
    setOffer(null);
    startFull();
  }, [startFull]);
  const neverShow = useCallback(() => {
    setOffer(null);
    void callOnboarding({ action: "dismiss" });
  }, []);
  const startFromAnnouncement = useCallback(() => {
    setOffer(null);
    void callOnboarding({ action: "announce" });
    startFull();
  }, [startFull]);
  const dismissAnnouncement = useCallback(() => {
    setOffer(null);
    void callOnboarding({ action: "announce" });
  }, []);

  const value = useMemo<TourApi>(
    () => ({ available: true, remembers: account, running, openMenu, startTour, startPage, startFull }),
    [account, running, openMenu, startTour, startPage, startFull]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {menuOpen && <TourMenu page={page} onClose={closeMenu} onPage={startPage} onBasics={startBasics} onFull={startFull} onComponent={startTour} />}
      {offer?.kind === "resume" && <TourResumeDialog onContinue={continueTour} onRestart={restartTour} onLater={closeOffer} onNever={neverShow} />}
      {offer?.kind === "announce" && <TourAnnounce onStart={startFromAnnouncement} onDismiss={dismissAnnouncement} />}
    </TourContext.Provider>
  );
}

export default TourProvider;
