import { router, usePathname } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BackHandler, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TourMenu } from '@/components/tour/tour-menu';
import { TourOffers, type Offer } from '@/components/tour/tour-offers';
import { TourHostContext, TourRegisterContext } from '@/components/tour/tour-layer';
import { TourOverlay, type ShownCard } from '@/components/tour/tour-overlay';
import { callOnboarding } from '@/components/tour/onboarding';
import { getScroller, locateTarget, type Located } from '@/components/tour/registry';
import { useT } from '@/i18n/client';
import { scrollDeltaFor, type CardSide, type Safe } from '@gastify/core/tour/geometry';
import { progressFor } from '@gastify/core/tour/progress';
import {
  MOBILE_FULL_TOUR,
  MOBILE_TOUR_STEPS,
  isMobileComponentTour,
  mobileScreenForPath,
  pathForMobileScreen,
  screenOfMobileTour,
  stepBodyKey,
  stepTitleKey,
  SCREEN_TOUR_ID,
  type MobileScreen,
  type MobileTourId,
  type TourStep,
} from '@gastify/core/tour/mobileSteps';

// How long the engine waits for a control that an earlier card opens (a panel, a screen), and for one that should already be there.
const LATER_WAIT_MS = 3000;
const THERE_WAIT_MS = 600;
// How long a scroll takes to settle before the control is measured again.
const SCROLL_SETTLE_MS = 420;
// A scroll to a control is followed by measurements until the control stops moving: the first look after this time (an animated
// scroll has begun by then), then one look every SCROLL_POLL_MS, and no more than SCROLL_MAX_MS in all.
const SCROLL_FIRST_LOOK_MS = 120;
const SCROLL_POLL_MS = 60;
const SCROLL_MAX_MS = 1500;
// A pop-up that closes is gone after its close animation: the tutorial waits for that, no longer than POPUP_LEAVE_MAX_MS.
const POPUP_LEAVE_POLL_MS = 40;
const POPUP_LEAVE_MAX_MS = 1200;
// How long a sheet takes to grow in: a control inside it is measured once the sheet has settled.
const SHEET_SETTLE_MS = 320;
const FALLBACK_CARD_HEIGHT = 230;

// The controls the bottom bar draws are fixed on screen: scrolling the page never moves them, so the engine never tries to.
const isFixed = (anchor: string) => anchor.startsWith('m-tab-');

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Run {
  id: MobileTourId;
  // The tours of a walk through the whole app, and where this one is in it (a single tour is a list of one).
  list: readonly MobileTourId[];
  position: number;
}

interface Active extends ShownCard {
  step: TourStep;
  index: number;
  run: Run;
  entry?: Located['entry'];
}

export interface TourApi {
  // True while a tour is on screen.
  running: boolean;
  // The screen the person is on, when it has a tour of its own.
  screen: MobileScreen | null;
  startTour: (id: MobileTourId) => void;
  startScreenTour: () => void;
  startFullTour: () => void;
  openMenu: () => void;
}

const TourContext = createContext<TourApi | null>(null);

export function useTour(): TourApi {
  const value = useContext(TourContext);
  if (!value) throw new Error('useTour must be used inside TourProvider');
  return value;
}

// The phone's guided tutorial: it owns the tour that is running (the card and the dark layer with a hole where the control is), the
// menu that starts one and the offers it makes by itself. It sits above the whole app, inside the signed-in gate.
export function TourProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const screen = mobileScreenForPath(pathname);

  const [active, setActive] = useState<Active | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  // The pop-ups that are open, in the order they opened: the last one draws the tutorial's card (see tour-layer.ts).
  const [sheets, setSheets] = useState<string[]>([]);
  // The part of the window the cards may use: below the status bar and above the home indicator.
  const safe = useMemo<Safe>(() => ({ width, top: insets.top + 12, bottom: height - insets.bottom - 16 }), [width, height, insets.top, insets.bottom]);

  // The engine's own state: it changes while a step is being prepared, which no screen needs to render.
  const token = useRef(0);
  const cardHeight = useRef(FALLBACK_CARD_HEIGHT);
  const pathRef = useRef(pathname);
  // How many pop-ups are registered (open, or still closing): see waitForPopupsToLeave.
  const sheetsRef = useRef(0);
  const safeRef = useRef<Safe>(safe);
  const activeRef = useRef<Active | null>(null);
  const translate = useRef(t);
  // `finish` starts the next tour of a walk through `begin`, and `begin` reaches `finish` through `present`: the ref breaks the cycle.
  const beginRef = useRef<(run: Run, mine: number) => Promise<void>>(async () => {});
  useEffect(() => {
    pathRef.current = pathname;
    sheetsRef.current = sheets.length;
    safeRef.current = safe;
    activeRef.current = active;
    translate.current = t;
  });

  const stop = useCallback(() => {
    token.current += 1;
    setActive(null);
  }, []);

  // A pop-up registers while it is open; the one registered last draws the card.
  const register = useCallback((id: string, open: boolean) => {
    setSheets((current) => (open ? (current.includes(id) ? current : [...current, id]) : current.filter((x) => x !== id)));
  }, []);

  // Waits until no pop-up is registered any more (a pop-up that was closed stays until its close animation ends), so a card that
  // follows the close is counted and placed against the screen alone. Bounded: the tutorial goes on even if a pop-up lingers.
  const waitForPopupsToLeave = useCallback(async (mine: number) => {
    const started = Date.now();
    while (sheetsRef.current > 0 && Date.now() - started < POPUP_LEAVE_MAX_MS) {
      if (mine !== token.current) return;
      await sleep(POPUP_LEAVE_POLL_MS);
    }
  }, []);

  // Where a control is, waiting for it when an earlier card opens it. Null when it never shows up.
  const waitFor = useCallback(async (step: TourStep, mine: number): Promise<Located | null> => {
    const ids = [step.anchor, step.fallback].filter((id): id is string => Boolean(id));
    // An optional card that is not waited for is skipped at once: a step that is not `later` should be on screen already.
    const limit = step.later ? step.waitMs ?? LATER_WAIT_MS : step.optional ? 0 : THERE_WAIT_MS;
    const started = Date.now();
    for (;;) {
      for (const id of ids) {
        const found = await locateTarget(id);
        if (found) return found;
      }
      if (mine !== token.current || Date.now() - started >= limit) return null;
      await sleep(150);
    }
  }, []);

  // Scrolls the screen so the control and its card fit, and measures the control again once it settles.
  const bringIntoView = useCallback(async (located: Located, mine: number): Promise<Located> => {
    // A control inside a pop-up moves with the pop-up, not with the screen: it is measured where it is. The screen behind a pop-up
    // is scrolled like any other, so the controls it has after the pop-up closes are in view when their card shows.
    if (isFixed(located.id) || located.entry.inSheet) return located;
    const scroller = getScroller();
    if (!scroller) return located;
    const delta = scrollDeltaFor({ target: located.rect, safe: safeRef.current, cardHeight: cardHeight.current });
    if (delta === 0) return located;
    scroller.scrollBy(delta);
    // The scroll is an animation of unknown length: the control is measured again until it stops moving, so the card is never
    // placed where the control was halfway through the scroll.
    await sleep(SCROLL_FIRST_LOOK_MS);
    if (mine !== token.current) return located;
    let previous = (await locateTarget(located.id)) ?? located;
    const started = Date.now();
    for (;;) {
      await sleep(SCROLL_POLL_MS);
      if (mine !== token.current) return previous;
      const current = (await locateTarget(located.id)) ?? previous;
      if (Math.abs(current.rect.y - previous.rect.y) < 1 || Date.now() - started > SCROLL_MAX_MS) return current;
      previous = current;
    }
  }, []);

  // Moves to another screen (the full tour goes screen by screen) and waits until it is the one on top.
  const goToScreen = useCallback(async (target: MobileScreen, mine: number) => {
    const path = pathForMobileScreen(target);
    if (mobileScreenForPath(pathRef.current) !== target) router.navigate(path as never);
    const started = Date.now();
    while (mobileScreenForPath(pathRef.current) !== target && Date.now() - started < 4000) {
      if (mine !== token.current) return;
      await sleep(100);
    }
    await sleep(350);
  }, []);

  // Shows the card of one step. `present` is the list of which cards of the tour exist right now (for the count).
  const showCard = useCallback(async (run: Run, index: number, located: Located | null, mine: number) => {
    const steps = MOBILE_TOUR_STEPS[run.id];
    const step = steps[index];
    const present = await Promise.all(
      steps.map(async (candidate) => {
        if (!candidate.anchor) return true;
        return Boolean((await locateTarget(candidate.anchor)) ?? (candidate.fallback ? await locateTarget(candidate.fallback) : null));
      })
    );
    if (mine !== token.current) return;
    const progress = progressFor(steps, present, index);
    const say = translate.current;
    const last = !steps.slice(index + 1).some((later, offset) => present[index + 1 + offset] || later.later);
    const inFull = run.list.length > 1;
    const count = progress.open ? say('tour.ui.progressOpen', { p1: progress.shown }) : say('tour.ui.progress', { p1: progress.shown, p2: progress.total });
    const side: CardSide | undefined = typeof step.side === 'string' ? (step.side === 'top' ? 'top' : step.side === 'bottom' ? 'bottom' : undefined) : undefined;
    // The first card shown is the first one that exists: a card that was skipped before it does not make this one "not first".
    const firstShown = !steps.slice(0, index).some((earlier, position) => present[position] && !earlier.later);
    setActive({
      step,
      index,
      run,
      entry: located?.entry,
      title: say(stepTitleKey(step)),
      body: say(stepBodyKey(step)),
      rect: located?.rect ?? null,
      side,
      progress: count,
      first: firstShown,
      last,
      offerFull: run.id === 'mIntro' && !inFull && last,
      section: inFull ? say('tour.ui.sectionOf', { p1: run.position + 1, p2: run.list.length }) : undefined,
    });
  }, []);

  const finish = useCallback(
    async (run: Run, mine: number) => {
      const next = run.list[run.position + 1];
      if (next) {
        await beginRef.current({ id: next, list: run.list, position: run.position + 1 }, mine);
        return;
      }
      stop();
      // The whole walk, not the welcome alone, is what "done" means for the account.
      if (run.list.length > 1) void callOnboarding({ action: 'complete' });
    },
    [stop]
  );

  // Looks for the first card of `run` that can be shown, going `dir` from `from`, and shows it; at the end of the tour, finishes it.
  const present = useCallback(
    async (run: Run, from: number, dir: 1 | -1, mine: number) => {
      const steps = MOBILE_TOUR_STEPS[run.id];
      let index = from;
      while (index >= 0 && index < steps.length) {
        const step = steps[index];
        // The card that opens a panel is pointless when the panel is already open.
        if (step.skipIf && (await locateTarget(step.skipIf))) {
          index += dir;
          continue;
        }
        if (!step.anchor) {
          await showCard(run, index, null, mine);
          return;
        }
        let found = await waitFor(step, mine);
        if (mine !== token.current) return;
        // A control inside a pop-up that a card just opened is measured once the pop-up has grown in.
        if (found && step.later && found.entry.inSheet) {
          await sleep(SHEET_SETTLE_MS);
          found = (await locateTarget(found.id)) ?? found;
        }
        if (!found) {
          index += dir;
          continue;
        }
        const placed = await bringIntoView(found, mine);
        if (mine !== token.current) return;
        await showCard(run, index, placed, mine);
        return;
      }
      if (mine !== token.current) return;
      if (dir === 1) await finish(run, mine);
      else await present(run, 0, 1, mine);
    },
    [bringIntoView, finish, showCard, waitFor]
  );

  // Whether a component's controls are on the screen already (a summary inside an account, say).
  const anyAnchorHere = useCallback(async (run: Run) => {
    for (const step of MOBILE_TOUR_STEPS[run.id]) {
      if (step.anchor && (await locateTarget(step.anchor))) return true;
    }
    return false;
  }, []);

  // Starts a tour of a run: goes to its screen first when it belongs to another one. A component that is here already is toured here.
  const begin = useCallback(
    async (run: Run, mine: number) => {
      const target = screenOfMobileTour(run.id);
      const here = isMobileComponentTour(run.id) && (await anyAnchorHere(run));
      if (target && !here) await goToScreen(target, mine);
      if (mine !== token.current) return;
      // A screen tour starts at the top, where its first control always is.
      if (run.id !== 'mIntro' && !isMobileComponentTour(run.id)) {
        getScroller()?.scrollToTop();
        await sleep(SCROLL_SETTLE_MS);
      }
      if (mine !== token.current) return;
      await present(run, 0, 1, mine);
    },
    [anyAnchorHere, goToScreen, present]
  );

  useEffect(() => {
    beginRef.current = begin;
  });

  const startRun = useCallback(
    (run: Run) => {
      token.current += 1;
      setMenuOpen(false);
      void beginRef.current(run, token.current);
    },
    []
  );

  const startTour = useCallback((id: MobileTourId) => startRun({ id, list: [id], position: 0 }), [startRun]);
  const startFullTour = useCallback(() => startRun({ id: MOBILE_FULL_TOUR[0], list: MOBILE_FULL_TOUR, position: 0 }), [startRun]);
  const startScreenTour = useCallback(() => {
    const current = mobileScreenForPath(pathRef.current);
    if (current) startTour(SCREEN_TOUR_ID[current]);
    else startTour('mIntro');
  }, [startTour]);

  const next = useCallback(() => {
    const card = activeRef.current;
    if (!card) return;
    // A card that asks for a press: "Next" presses the control for the person, and the cards that follow find what it opened.
    // Only a card that presses its control can close a pop-up: the others leave the pop-up (if any) open.
    const pressed = card.step.clickToContinue ? card.entry : undefined;
    pressed?.onPress?.();
    token.current += 1;
    const mine = token.current;
    void (async () => {
      // A control inside a pop-up that the press closed: the cards after it are placed and counted once the pop-up has gone.
      if (pressed?.inSheet) await waitForPopupsToLeave(mine);
      await present(card.run, card.index + 1, 1, mine);
    })();
  }, [present, waitForPopupsToLeave]);

  const prev = useCallback(() => {
    const card = activeRef.current;
    if (!card) return;
    token.current += 1;
    void present(card.run, card.index - 1, -1, token.current);
  }, [present]);

  // The Android back button closes the tour instead of leaving the screen under it.
  useEffect(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      stop();
      return true;
    });
    return () => subscription.remove();
  }, [active, stop]);

  // What the account remembers: the first session starts the welcome, a returning one is offered it, and an account from before the
  // tutorial is told about it once. The answer comes from the server's rules (autoActionFor), never from the phone.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const reply = await callOnboarding({ action: 'visit' });
      if (cancelled || !reply?.action) return;
      if (reply.action === 'welcome' || reply.action === 'resume') setOffer('welcome');
      else if (reply.action === 'announce') setOffer('announce');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const api = useMemo<TourApi>(
    () => ({ running: active !== null, screen, startTour, startScreenTour, startFullTour, openMenu: () => setMenuOpen(true) }),
    [active, screen, startTour, startScreenTour, startFullTour]
  );

  const overlay = active ? (
    <TourOverlay
      card={active}
      safe={safe}
      onNext={next}
      onPrev={prev}
      onClose={stop}
      onFull={startFullTour}
      onCardHeight={(value) => {
        cardHeight.current = value;
      }}
    />
  ) : null;

  return (
    <TourContext.Provider value={api}>
      <TourRegisterContext.Provider value={register}>
        <TourHostContext.Provider value={{ top: sheets[sheets.length - 1] ?? null, overlay }}>
          {children}
          {sheets.length === 0 ? overlay : null}
          <TourMenu visible={menuOpen} screen={screen} onClose={() => setMenuOpen(false)} onStart={startTour} onScreen={startScreenTour} onFull={startFullTour} />
          <TourOffers
            offer={offer}
            onStart={() => {
              setOffer(null);
              startTour('mIntro');
            }}
            onLater={() => setOffer(null)}
            onNever={() => {
              setOffer(null);
              void callOnboarding({ action: 'dismiss' });
            }}
            onOpenMenu={() => {
              setOffer(null);
              void callOnboarding({ action: 'announce' });
              setMenuOpen(true);
            }}
            onAnnounced={() => {
              setOffer(null);
              void callOnboarding({ action: 'announce' });
            }}
          />
        </TourHostContext.Provider>
      </TourRegisterContext.Provider>
    </TourContext.Provider>
  );
}
