// The geometry of the phone's tutorial: where the highlighted control is, where its card goes and how far the screen has to scroll so
// both fit. Pure numbers (window coordinates, in points), so the rules can be tested without a screen.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// The part of the window where the tutorial may draw: `top` is below the status bar and `bottom` above the floating tab bar.
export interface Safe {
  width: number;
  top: number;
  bottom: number;
}

export type CardSide = "top" | "bottom";

export interface CardPlacement {
  left: number;
  top: number;
  // Where the card went relative to the control; "overlay" when neither side had room and the card covers part of it.
  side: CardSide | "center" | "overlay";
}

export const CARD_GAP = 12;
export const CARD_MARGIN = 16;
// The breathing room the highlight leaves around the control.
export const SPOTLIGHT_PAD = 6;

export function padRect(rect: Rect, pad: number): Rect {
  return { x: rect.x - pad, y: rect.y - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 };
}

// The highlight of a control: its rectangle with some room around it, kept inside the window.
export function spotlightFor(target: Rect, windowWidth: number, pad = SPOTLIGHT_PAD): Rect {
  const padded = padRect(target, pad);
  const x = Math.max(4, padded.x);
  const right = Math.min(windowWidth - 4, padded.x + padded.width);
  return { x, y: padded.y, width: Math.max(0, right - x), height: padded.height };
}

// The width of the card: nearly the whole window on a phone, never wider than `max` on a tablet.
export function cardWidth(windowWidth: number, max = 400): number {
  return Math.min(windowWidth - CARD_MARGIN * 2, max);
}

// Where the card goes. Without a control it is centered; with one it goes on the side the step asked for when it fits there, else
// on the side with more room, and when neither fits it sits at the bottom of the safe area over the control.
export function cardPlacement({ target, safe, card, prefer }: { target: Rect | null; safe: Safe; card: { width: number; height: number }; prefer?: CardSide }): CardPlacement {
  const left = Math.round((safe.width - card.width) / 2);
  if (!target) return { left, top: Math.round(safe.top + (safe.bottom - safe.top - card.height) / 2), side: "center" };
  const spot = padRect(target, SPOTLIGHT_PAD);
  // A control that is scrolled out of the safe area leaves no room beside it on the screen: a card "above" it would land below the
  // screen. Such a card goes to the bottom of the safe area, where it stays in sight.
  const onScreen = spot.y < safe.bottom && spot.y + spot.height > safe.top;
  const below = safe.bottom - (spot.y + spot.height) - CARD_GAP;
  const above = spot.y - safe.top - CARD_GAP;
  const fitsBelow = onScreen && below >= card.height;
  const fitsAbove = onScreen && above >= card.height;
  let side: CardSide | null = null;
  if (prefer === "bottom" && fitsBelow) side = "bottom";
  else if (prefer === "top" && fitsAbove) side = "top";
  else if (fitsBelow && fitsAbove) side = below >= above ? "bottom" : "top";
  else if (fitsBelow) side = "bottom";
  else if (fitsAbove) side = "top";
  if (side === "bottom") return { left, top: Math.round(spot.y + spot.height + CARD_GAP), side };
  if (side === "top") return { left, top: Math.round(spot.y - CARD_GAP - card.height), side };
  return { left, top: Math.round(Math.max(safe.top, safe.bottom - card.height)), side: "overlay" };
}

// How far the screen has to scroll (positive: down) so the control and its card fit in the safe area. Zero when they already do.
// The control goes near the top, the card under it.
export function scrollDeltaFor({ target, safe, cardHeight }: { target: Rect; safe: Safe; cardHeight: number }): number {
  const spot = padRect(target, SPOTLIGHT_PAD);
  const bottom = spot.y + spot.height;
  const cardBelowFits = spot.y >= safe.top && bottom + CARD_GAP + cardHeight <= safe.bottom;
  const cardAboveFits = bottom <= safe.bottom && spot.y - CARD_GAP - cardHeight >= safe.top;
  if (cardBelowFits || cardAboveFits) return 0;
  return Math.round(spot.y - (safe.top + CARD_MARGIN));
}
