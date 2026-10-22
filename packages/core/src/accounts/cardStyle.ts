// How an account's card looks: a color (or "auto", the color the app picks from the account) and a background pattern.
// Stored on the account, so every device and the web draw the same card. The lists are short and fixed on purpose: a
// saved value must be one of them, and the server refuses anything else.

export const DEFAULT_CARD_COLOR = "auto";
export const DEFAULT_CARD_PATTERN = "circles";

export interface CardColorOption {
  id: string;
  label: string;
  group: CardColorGroup;
  // Two or more stops; more than two only for the rainbow. The first stop decides the color of the text on the card.
  stops: string[];
}

export type CardColorGroup = "Neutros" | "Rojos y rosas" | "Naranjas y amarillos" | "Verdes" | "Azules" | "Morados" | "Tierra" | "Arcoíris";

export const CARD_COLORS: CardColorOption[] = [
  { id: "white", label: "Blanca", group: "Neutros", stops: ["#ffffff", "#e5e7eb"] },
  { id: "pearl", label: "Perla", group: "Neutros", stops: ["#fafaf9", "#d6d3d1"] },
  { id: "silver", label: "Plata", group: "Neutros", stops: ["#e4e4e7", "#a1a1aa"] },
  { id: "gray", label: "Gris", group: "Neutros", stops: ["#71717a", "#3f3f46"] },
  { id: "graphite", label: "Grafito", group: "Neutros", stops: ["#52525b", "#27272a"] },
  { id: "black", label: "Negra", group: "Neutros", stops: ["#27272a", "#09090b"] },
  { id: "jet", label: "Azabache", group: "Neutros", stops: ["#111111", "#000000"] },

  { id: "red", label: "Roja", group: "Rojos y rosas", stops: ["#ef4444", "#991b1b"] },
  { id: "wine", label: "Vino", group: "Rojos y rosas", stops: ["#9f1239", "#4c0519"] },
  { id: "rose", label: "Rosa", group: "Rojos y rosas", stops: ["#fb7185", "#e11d48"] },
  { id: "pink", label: "Fucsia", group: "Rojos y rosas", stops: ["#f472b6", "#be185d"] },
  { id: "blush", label: "Rosa pastel", group: "Rojos y rosas", stops: ["#fbcfe8", "#f9a8d4"] },

  { id: "orange", label: "Naranja", group: "Naranjas y amarillos", stops: ["#fb923c", "#c2410c"] },
  { id: "peach", label: "Durazno", group: "Naranjas y amarillos", stops: ["#fed7aa", "#fb923c"] },
  { id: "amber", label: "Ámbar", group: "Naranjas y amarillos", stops: ["#fcd34d", "#f59e0b"] },
  { id: "yellow", label: "Amarilla", group: "Naranjas y amarillos", stops: ["#facc15", "#ca8a04"] },
  { id: "lemon", label: "Limón", group: "Naranjas y amarillos", stops: ["#fef08a", "#eab308"] },

  { id: "green", label: "Verde", group: "Verdes", stops: ["#22c55e", "#15803d"] },
  { id: "emerald", label: "Esmeralda", group: "Verdes", stops: ["#059669", "#064e3b"] },
  { id: "mint", label: "Menta", group: "Verdes", stops: ["#6ee7b7", "#10b981"] },
  { id: "forest", label: "Bosque", group: "Verdes", stops: ["#3f6212", "#1a2e05"] },
  { id: "lime", label: "Lima", group: "Verdes", stops: ["#bef264", "#65a30d"] },

  { id: "blue", label: "Azul", group: "Azules", stops: ["#3b82f6", "#1d4ed8"] },
  { id: "navy", label: "Marino", group: "Azules", stops: ["#1e3a8a", "#172554"] },
  { id: "sky", label: "Celeste", group: "Azules", stops: ["#7dd3fc", "#38bdf8"] },
  { id: "turquoise", label: "Turmalina", group: "Azules", stops: ["#2dd4bf", "#0d9488"] },
  { id: "teal", label: "Petróleo", group: "Azules", stops: ["#115e59", "#042f2e"] },
  { id: "indigo", label: "Índigo", group: "Azules", stops: ["#6366f1", "#4338ca"] },

  { id: "violet", label: "Violeta", group: "Morados", stops: ["#8b5cf6", "#5b21b6"] },
  { id: "lavender", label: "Lavanda", group: "Morados", stops: ["#c4b5fd", "#a78bfa"] },
  { id: "magenta", label: "Magenta", group: "Morados", stops: ["#d946ef", "#a21caf"] },
  { id: "plum", label: "Ciruela", group: "Morados", stops: ["#7e22ce", "#3b0764"] },

  { id: "coffee", label: "Café", group: "Tierra", stops: ["#92400e", "#451a03"] },
  { id: "copper", label: "Cobre", group: "Tierra", stops: ["#c2410c", "#7c2d12"] },
  { id: "sand", label: "Arena", group: "Tierra", stops: ["#e7d3a3", "#c8a86b"] },

  { id: "rainbow", label: "Arcoíris", group: "Arcoíris", stops: ["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7"] },
];

export interface CardPatternOption {
  id: string;
  label: string;
}

export const CARD_PATTERNS: CardPatternOption[] = [
  { id: "circles", label: "Círculos" },
  { id: "plain", label: "Liso" },
  { id: "dots", label: "Puntos" },
  { id: "stripes", label: "Rayas" },
  { id: "grid", label: "Cuadrícula" },
  { id: "waves", label: "Ondas" },
];

export const isCardColor = (value: unknown): value is string =>
  value === DEFAULT_CARD_COLOR || (typeof value === "string" && CARD_COLORS.some((option) => option.id === value));

export const isCardPattern = (value: unknown): value is string =>
  typeof value === "string" && CARD_PATTERNS.some((option) => option.id === value);
