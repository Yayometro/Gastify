// How an account's card looks: a color (or "auto", the color the app picks from the account) and a background pattern.
// Stored on the account, so every device and the web draw the same card. The lists are short and fixed on purpose: a
// saved value must be one of them, and the server refuses anything else.
//
// The names shown to the person are catalog keys (the "accounts" namespace): the screen translates them with t(label).
// The ids and the groups are what is stored and compared, so they never change with the language.

export const DEFAULT_CARD_COLOR = "auto";
export const DEFAULT_CARD_PATTERN = "circles";

export interface CardColorOption {
  id: string;
  // The catalog key of the name ("accounts.card.color.white").
  label: string;
  group: CardColorGroup;
  // Two or more stops; more than two only for the rainbow. The first stop decides the color of the text on the card.
  stops: string[];
}

export type CardColorGroup = "neutral" | "reds" | "oranges" | "greens" | "blues" | "purples" | "earth" | "rainbow";

export const CARD_COLORS: CardColorOption[] = [
  { id: "white", label: "accounts.card.color.white", group: "neutral", stops: ["#ffffff", "#e5e7eb"] },
  { id: "pearl", label: "accounts.card.color.pearl", group: "neutral", stops: ["#fafaf9", "#d6d3d1"] },
  { id: "silver", label: "accounts.card.color.silver", group: "neutral", stops: ["#e4e4e7", "#a1a1aa"] },
  { id: "gray", label: "accounts.card.color.gray", group: "neutral", stops: ["#71717a", "#3f3f46"] },
  { id: "graphite", label: "accounts.card.color.graphite", group: "neutral", stops: ["#52525b", "#27272a"] },
  { id: "black", label: "accounts.card.color.black", group: "neutral", stops: ["#27272a", "#09090b"] },
  { id: "jet", label: "accounts.card.color.jet", group: "neutral", stops: ["#111111", "#000000"] },

  { id: "red", label: "accounts.card.color.red", group: "reds", stops: ["#ef4444", "#991b1b"] },
  { id: "wine", label: "accounts.card.color.wine", group: "reds", stops: ["#9f1239", "#4c0519"] },
  { id: "rose", label: "accounts.card.color.rose", group: "reds", stops: ["#fb7185", "#e11d48"] },
  { id: "pink", label: "accounts.card.color.pink", group: "reds", stops: ["#f472b6", "#be185d"] },
  { id: "blush", label: "accounts.card.color.blush", group: "reds", stops: ["#fbcfe8", "#f9a8d4"] },

  { id: "orange", label: "accounts.card.color.orange", group: "oranges", stops: ["#fb923c", "#c2410c"] },
  { id: "peach", label: "accounts.card.color.peach", group: "oranges", stops: ["#fed7aa", "#fb923c"] },
  { id: "amber", label: "accounts.card.color.amber", group: "oranges", stops: ["#fcd34d", "#f59e0b"] },
  { id: "yellow", label: "accounts.card.color.yellow", group: "oranges", stops: ["#facc15", "#ca8a04"] },
  { id: "lemon", label: "accounts.card.color.lemon", group: "oranges", stops: ["#fef08a", "#eab308"] },

  { id: "green", label: "accounts.card.color.green", group: "greens", stops: ["#22c55e", "#15803d"] },
  { id: "emerald", label: "accounts.card.color.emerald", group: "greens", stops: ["#059669", "#064e3b"] },
  { id: "mint", label: "accounts.card.color.mint", group: "greens", stops: ["#6ee7b7", "#10b981"] },
  { id: "forest", label: "accounts.card.color.forest", group: "greens", stops: ["#3f6212", "#1a2e05"] },
  { id: "lime", label: "accounts.card.color.lime", group: "greens", stops: ["#bef264", "#65a30d"] },

  { id: "blue", label: "accounts.card.color.blue", group: "blues", stops: ["#3b82f6", "#1d4ed8"] },
  { id: "navy", label: "accounts.card.color.navy", group: "blues", stops: ["#1e3a8a", "#172554"] },
  { id: "sky", label: "accounts.card.color.sky", group: "blues", stops: ["#7dd3fc", "#38bdf8"] },
  { id: "turquoise", label: "accounts.card.color.turquoise", group: "blues", stops: ["#2dd4bf", "#0d9488"] },
  { id: "teal", label: "accounts.card.color.teal", group: "blues", stops: ["#115e59", "#042f2e"] },
  { id: "indigo", label: "accounts.card.color.indigo", group: "blues", stops: ["#6366f1", "#4338ca"] },

  { id: "violet", label: "accounts.card.color.violet", group: "purples", stops: ["#8b5cf6", "#5b21b6"] },
  { id: "lavender", label: "accounts.card.color.lavender", group: "purples", stops: ["#c4b5fd", "#a78bfa"] },
  { id: "magenta", label: "accounts.card.color.magenta", group: "purples", stops: ["#d946ef", "#a21caf"] },
  { id: "plum", label: "accounts.card.color.plum", group: "purples", stops: ["#7e22ce", "#3b0764"] },

  { id: "coffee", label: "accounts.card.color.coffee", group: "earth", stops: ["#92400e", "#451a03"] },
  { id: "copper", label: "accounts.card.color.copper", group: "earth", stops: ["#c2410c", "#7c2d12"] },
  { id: "sand", label: "accounts.card.color.sand", group: "earth", stops: ["#e7d3a3", "#c8a86b"] },

  { id: "rainbow", label: "accounts.card.color.rainbow", group: "rainbow", stops: ["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7"] },
];

export interface CardPatternOption {
  id: string;
  // The catalog key of the name ("accounts.card.pattern.circles").
  label: string;
}

export const CARD_PATTERNS: CardPatternOption[] = [
  { id: "circles", label: "accounts.card.pattern.circles" },
  { id: "plain", label: "accounts.card.pattern.plain" },
  { id: "dots", label: "accounts.card.pattern.dots" },
  { id: "stripes", label: "accounts.card.pattern.stripes" },
  { id: "grid", label: "accounts.card.pattern.grid" },
  { id: "waves", label: "accounts.card.pattern.waves" },
];

export const isCardColor = (value: unknown): value is string =>
  value === DEFAULT_CARD_COLOR || (typeof value === "string" && CARD_COLORS.some((option) => option.id === value));

export const isCardPattern = (value: unknown): value is string =>
  typeof value === "string" && CARD_PATTERNS.some((option) => option.id === value);
