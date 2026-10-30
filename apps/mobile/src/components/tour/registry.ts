import type { RefObject } from 'react';
import type { HostInstance } from 'react-native';

import type { Rect } from '@gastify/core/tour/geometry';

// What the tutorial knows about the screen: the controls that screens have marked (see TourTarget) and the scroll area of the screen on
// top. It lives outside React on purpose: the engine asks "where is this control right now?" whenever a card is about to show.

// A marked control: its view, and what a card that asks the person to press it does for them ("Next" presses it).
export interface TargetEntry {
  ref: RefObject<HostInstance | null>;
  onPress?: () => void;
  // The control is inside a pop-up over the screen (see InSheetContext): it is reached through the pop-up, never by scrolling the screen.
  inSheet: boolean;
}

const targets = new Map<string, Set<TargetEntry>>();

// Registers a control under an id. Several controls may share one (every card has its own "?"); the engine picks the topmost.
export function registerTarget(id: string, entry: TargetEntry): () => void {
  let entries = targets.get(id);
  if (!entries) {
    entries = new Set();
    targets.set(id, entries);
  }
  entries.add(entry);
  return () => {
    entries.delete(entry);
    if (entries.size === 0) targets.delete(id);
  };
}

function measure(view: HostInstance | null): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!view) return resolve(null);
    // A view that is not attached (a screen that is not on top) may never answer.
    const timer = setTimeout(() => resolve(null), 400);
    view.measureInWindow((x, y, width, height) => {
      clearTimeout(timer);
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}

export interface Located {
  id: string;
  rect: Rect;
  entry: TargetEntry;
}

// Where a marked control is on screen right now (window coordinates), or null when it is not there.
export async function locateTarget(id: string): Promise<Located | null> {
  const entries = [...(targets.get(id) ?? [])];
  if (entries.length === 0) return null;
  const found = await Promise.all(entries.map(async (entry) => ({ id, entry, rect: await measure(entry.ref.current) })));
  const shown = found.filter((item): item is Located => item.rect !== null);
  if (shown.length === 0) return null;
  return shown.reduce((best, item) => (item.rect.y < best.rect.y ? item : best));
}

// The scroll area of the screen on top: the engine moves it so the control a card talks about is on screen.
export interface Scroller {
  // Scrolls by `delta` points (positive: down) from where the screen is now.
  scrollBy: (delta: number) => void;
  // Back to the top, so the first control of a tour is where it always is.
  scrollToTop: () => void;
}

let current: Scroller | null = null;

export function setScroller(scroller: Scroller | null): void {
  current = scroller;
}

export function getScroller(): Scroller | null {
  return current;
}
