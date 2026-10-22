import { CARD_COLORS, DEFAULT_CARD_COLOR, DEFAULT_CARD_PATTERN } from '@gastify/core/accounts/cardStyle';

// The colors a card is drawn with, from the color chosen for the account (saved on the account, so every device agrees).
// "auto" (or a card saved before colors existed) keeps the color the app picks from the account itself.

const DARK_INK = '#111827';
const LIGHT_INK = '#ffffff';

// Relative luminance (WCAG): above the middle, the card is light and its text goes dark.
export function isLightColor(hex: string): boolean {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.36;
}

export function cardPalette(color: string | null | undefined, autoColors: [string, string]) {
  const preset = color && color !== DEFAULT_CARD_COLOR ? CARD_COLORS.find((option) => option.id === color) : undefined;
  const stops = preset ? preset.stops : autoColors;
  const light = preset ? isLightColor(preset.stops[0]) : false;
  const ink = light ? DARK_INK : LIGHT_INK;
  const tint = (alpha: number) => (light ? `rgba(17,24,39,${alpha})` : `rgba(255,255,255,${alpha})`);
  return { stops, ink, tint, light };
}

export { DEFAULT_CARD_COLOR, DEFAULT_CARD_PATTERN };
