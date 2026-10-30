import { createContext, useContext, useEffect, useId, type ReactNode } from 'react';

// The tutorial's card is drawn once: by the last pop-up that is open (a sheet over the screen), or by the screen when none is open.
// A card in a window of its own, presented after a sheet, ends up behind it or stacked on an invisible layer that swallows every
// touch. So a pop-up registers while it is open, and the one registered last draws the card inside its own window.
export const TourRegisterContext = createContext<((id: string, open: boolean) => void) | null>(null);

// True inside a pop-up: a control there moves with the pop-up, not with the screen behind it, so the tutorial never scrolls the screen for it.
export const InSheetContext = createContext(false);

export interface TourHost {
  // The pop-up that draws the card now (the last one open), and the card itself (null when no tour is running).
  top: string | null;
  overlay: ReactNode;
}
export const TourHostContext = createContext<TourHost | null>(null);

// A pop-up tells the tutorial whether it is open. `draws` says this pop-up holds the card now, and `overlay` is the card to render.
export function useTourHost(open: boolean): { draws: boolean; overlay: ReactNode } {
  const register = useContext(TourRegisterContext);
  const host = useContext(TourHostContext);
  const id = useId();
  useEffect(() => {
    if (!register || !open) return;
    register(id, true);
    return () => register(id, false);
  }, [register, id, open]);
  return { draws: open && host?.top === id && host.overlay !== null, overlay: host?.overlay ?? null };
}
