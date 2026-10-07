// "#rgb" / "#rrggbb" -> [r, g, b], or null when it is not a hex colour.
function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

// Dark text on a light background and light text on a dark one (WCAG relative
// luminance), so a coloured chip stays readable in both themes. Null when the
// colour is not a hex value the caller should then style some other way.
export function readableTextColor(background?: string | null): string | null {
  if (!background) return null;
  const rgb = parseHex(background);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? "#1e1533" : "#ffffff";
}
