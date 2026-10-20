// Colors for categories and sub-categories. The web offers a free color picker; on the phone there is
// a wide grid (12 hues x 4 lightness levels + grays) and a field for any hexadecimal color.

export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (value: number) => Math.round(value * 255).toString(16).padStart(2, "0");
  return `#${toHex(channel(0))}${toHex(channel(8))}${toHex(channel(4))}`.toUpperCase();
}

// "#F57C00", "f57c00" or "#f70" -> "#F57C00"; null when it is not a color.
export function normalizeHex(text: string): string | null {
  const raw = text.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

const HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const LIGHTNESS = [35, 50, 65, 80];
const GRAYS = ["#000000", "#3F3F46", "#71717A", "#A1A1AA", "#D4D4D8", "#F4F4F5"];

// Light-to-dark rows of every hue, then the grays.
export const COLOR_GRID: string[] = [...LIGHTNESS.flatMap((l) => HUES.map((h) => hslToHex(h, 78, l))), ...GRAYS];
