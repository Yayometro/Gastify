import * as SecureStore from 'expo-secure-store';
import { useEffect, useSyncExternalStore } from 'react';

// How an account's card looks. "auto" is the color the app picks from the account itself (the one the web shows);
// the rest are a short list on purpose, so every card still looks like a card of this app. The text on each card is
// chosen from its background, so a white card gets dark text and a black one gets light text.
export type CardStyleId = 'auto' | 'white' | 'black' | 'navy' | 'emerald' | 'amber' | 'rose';

export const CARD_STYLES: { id: CardStyleId; label: string; from?: string; to?: string }[] = [
  { id: 'auto', label: 'Automática' },
  { id: 'white', label: 'Blanca', from: '#ffffff', to: '#e5e7eb' },
  { id: 'black', label: 'Negra', from: '#27272a', to: '#09090b' },
  { id: 'navy', label: 'Marino', from: '#1e3a8a', to: '#172554' },
  { id: 'emerald', label: 'Esmeralda', from: '#059669', to: '#064e3b' },
  { id: 'amber', label: 'Ámbar', from: '#fcd34d', to: '#f59e0b' },
  { id: 'rose', label: 'Rosa', from: '#fb7185', to: '#e11d48' },
];

const KEY = 'gastify-account-card-styles';
const DARK_INK = '#111827';
const LIGHT_INK = '#ffffff';

// Relative luminance (WCAG): above the middle, the background is light and the text goes dark.
function isLightColor(hex: string): boolean {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.36;
}

// The colors a card is drawn with: its gradient, the text on it, and a soft overlay that reads on that ground.
export function cardPalette(style: CardStyleId, autoColors: [string, string]) {
  const preset = CARD_STYLES.find((item) => item.id === style);
  const [from, to] = preset?.from && preset.to ? [preset.from, preset.to] : autoColors;
  const light = preset?.from ? isLightColor(preset.from) : false;
  const ink = light ? DARK_INK : LIGHT_INK;
  const tint = (alpha: number) => (light ? `rgba(17,24,39,${alpha})` : `rgba(255,255,255,${alpha})`);
  return { from, to, ink, tint, light };
}

// The choices of every account, read once from the device and kept in memory for the screens that show them.
let cache: Record<string, CardStyleId> | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function load(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        cache = raw ? (JSON.parse(raw) as Record<string, CardStyleId>) : {};
      } catch {
        cache = {};
      }
      emit();
    })();
  }
  return loading;
}

export async function setAccountCardStyle(accountId: string, style: CardStyleId): Promise<void> {
  await load();
  const next = { ...(cache ?? {}) };
  if (style === 'auto') delete next[accountId];
  else next[accountId] = style;
  cache = next;
  emit();
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
  } catch {
    // Not saved: the choice still shows until the app restarts.
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useAccountCardStyle(accountId: string): CardStyleId {
  useEffect(() => {
    void load();
  }, []);
  return useSyncExternalStore(subscribe, () => cache?.[accountId] ?? 'auto', () => 'auto');
}
