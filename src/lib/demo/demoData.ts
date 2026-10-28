export type DemoCurrency = "MXN" | "USD" | "EUR" | "JPY";
export type DemoMovementType = "expense" | "income" | "transfer";

export interface DemoAccount {
  id: string;
  name: string;
  institution: string;
  currency: DemoCurrency;
  openingBalance: number;
  color: string;
}

export interface DemoCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DemoSubcategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  categoryId: string;
}

export interface DemoTransaction {
  id: string;
  date: string;
  description: string;
  type: DemoMovementType;
  accountId: string;
  categoryId?: string;
  nativeAmount: number;
  nativeCurrency: DemoCurrency;
  reportAmount: number;
  note?: string;
  projectId?: string;
  transferPeerAccountId?: string;
  transferPeerAmount?: number;
  transferPeerCurrency?: DemoCurrency;
}

export interface DemoBudget {
  id: string;
  categoryId: string;
  limit: number;
}

export interface DemoProject {
  id: string;
  name: string;
  icon: string;
  startDate: string;
  endDate: string;
  target: number;
  currency: DemoCurrency;
}

export interface DemoSavingsGoal {
  id: string;
  name: string;
  target: number;
  currency: DemoCurrency;
  accountId: string;
  targetDate: string;
}

export interface DemoSeed {
  accounts: DemoAccount[];
  categories: DemoCategory[];
  budgets: DemoBudget[];
  project: DemoProject;
  savingsGoal: DemoSavingsGoal;
  transactions: DemoTransaction[];
  months: string[];
}

export const DEMO_RATES_TO_MXN: Record<DemoCurrency, number> = {
  MXN: 1,
  USD: 18.25,
  EUR: 19.8,
  JPY: 0.122,
};

/** Offline projection baseline so the demo can show an actual-vs-projected history. */
export const DEMO_PROJECTION_BASELINE = {
  _id: "demo-projection-baseline",
  incomeHistory: [{
    effectiveFrom: "2024-11-01T00:00:00.000Z",
    effectiveTo: undefined,
    incomeMoney: { amountMinor: 6_500_000, currency: "MXN" },
  }],
  expenseHistory: [{
    effectiveFrom: "2024-11-01T00:00:00.000Z",
    effectiveTo: undefined,
    expenseMoney: { amountMinor: 3_900_000, currency: "MXN" },
  }],
};

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: "home", name: "Casa", icon: "fluent/house", color: "#ad8bff" },
  { id: "groceries", name: "Despensa", icon: "fluent/leafy-green", color: "#63d4be" },
  { id: "transport", name: "Transporte", icon: "fluent/bus", color: "#ffc276" },
  { id: "dining", name: "Restaurantes", icon: "fluent/fork-and-knife", color: "#f48bb4" },
  { id: "health", name: "Salud", icon: "fluent/pill", color: "#76a8ff" },
  { id: "subscriptions", name: "Suscripciones", icon: "fluent/laptop", color: "#b79cff" },
  { id: "travel", name: "Viajes", icon: "fluent/airplane", color: "#64c7ed" },
  { id: "entertainment", name: "Entretenimiento", icon: "fluent/party-popper", color: "#f0a36f" },
  { id: "utilities", name: "Servicios", icon: "fluent/light-bulb", color: "#b9a7df" },
  { id: "income", name: "Ingresos", icon: "fluent/money-bag", color: "#69d5aa" },
];

/** Built-in catalog entries shown separately from Alex's fictional custom categories. */
export const DEMO_DEFAULT_CATEGORIES: DemoCategory[] = [
  { id: "education", name: "Educación", icon: "md/MdSchool", color: "#8fb7ff" },
  { id: "pets", name: "Mascotas", icon: "fa/FaDog", color: "#f1a6c8" },
  { id: "personal-care", name: "Cuidado personal", icon: "fa/FaBath", color: "#e2a2ff" },
  { id: "shopping", name: "Compras", icon: "gi/GiClothes", color: "#ffbd7c" },
  { id: "gifts", name: "Regalos", icon: "gi/GiPresent", color: "#ff91a4" },
  { id: "taxes", name: "Impuestos", icon: "md/MdAccountBalance", color: "#82d5c5" },
  { id: "insurance", name: "Seguros", icon: "md/MdHealthAndSafety", color: "#82b6ed" },
];

export const DEMO_SUBCATEGORIES: DemoSubcategory[] = [
  { id: "home-rent", name: "Renta", icon: "md/MdOutlineHouse", color: "#ad8bff", categoryId: "home" },
  { id: "home-household", name: "Artículos del hogar", icon: "md/MdChair", color: "#ad8bff", categoryId: "home" },
  { id: "groceries-market", name: "Supermercado", icon: "md/MdLocalGroceryStore", color: "#63d4be", categoryId: "groceries" },
  { id: "groceries-coffee", name: "Café y pan", icon: "gi/GiCoffeeCup", color: "#63d4be", categoryId: "groceries" },
  { id: "transport-fuel", name: "Gasolina", icon: "md/MdLocalGasStation", color: "#ffc276", categoryId: "transport" },
  { id: "transport-rides", name: "Viajes en app y taxi", icon: "fa/FaCar", color: "#ffc276", categoryId: "transport" },
  { id: "dining-restaurants", name: "Restaurantes", icon: "md/MdRestaurant", color: "#f48bb4", categoryId: "dining" },
  { id: "dining-coffee", name: "Cafeterías", icon: "gi/GiCoffeeCup", color: "#f48bb4", categoryId: "dining" },
  { id: "health-pharmacy", name: "Farmacia", icon: "gi/GiMedicinePills", color: "#76a8ff", categoryId: "health" },
  { id: "health-care", name: "Consultas y cuidado", icon: "fa/FaBriefcaseMedical", color: "#76a8ff", categoryId: "health" },
  { id: "travel-flights", name: "Vuelos", icon: "md/MdFlightTakeoff", color: "#64c7ed", categoryId: "travel" },
  { id: "travel-lodging", name: "Hospedaje", icon: "md/MdBed", color: "#64c7ed", categoryId: "travel" },
  { id: "travel-local", name: "Gastos del viaje", icon: "gi/GiTravelDress", color: "#64c7ed", categoryId: "travel" },
  { id: "subscriptions-digital", name: "Servicios digitales", icon: "md/MdLaptopWindows", color: "#b79cff", categoryId: "subscriptions" },
  { id: "utilities-home", name: "Servicios del hogar", icon: "md/MdElectricBolt", color: "#b9a7df", categoryId: "utilities" },
];

export const DEMO_DEFAULT_SUBCATEGORIES: DemoSubcategory[] = [
  { id: "education-courses", name: "Cursos", icon: "gi/GiOpenBook", color: "#8fb7ff", categoryId: "education" },
  { id: "education-tuition", name: "Colegiaturas", icon: "md/MdSchool", color: "#8fb7ff", categoryId: "education" },
  { id: "pets-food", name: "Alimento", icon: "fa/FaDog", color: "#f1a6c8", categoryId: "pets" },
  { id: "pets-vet", name: "Veterinario", icon: "fa/FaBriefcaseMedical", color: "#f1a6c8", categoryId: "pets" },
  { id: "shopping-clothing", name: "Ropa", icon: "gi/GiClothes", color: "#ffbd7c", categoryId: "shopping" },
  { id: "shopping-electronics", name: "Electrónica", icon: "gi/GiKeyboard", color: "#ffbd7c", categoryId: "shopping" },
  { id: "gifts-celebrations", name: "Celebraciones", icon: "gi/GiPartyPopper", color: "#ff91a4", categoryId: "gifts" },
  { id: "taxes-government", name: "Pagos gubernamentales", icon: "md/MdAccountBalance", color: "#82d5c5", categoryId: "taxes" },
];

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "bbva", name: "BBVA Nómina", institution: "BBVA", currency: "MXN", openingBalance: 62_000, color: "#6c83ff" },
  { id: "revolut", name: "Revolut", institution: "Revolut", currency: "USD", openingBalance: 1_250, color: "#62d4be" },
  { id: "japan", name: "Fondo de viaje", institution: "Cuenta JPY", currency: "JPY", openingBalance: 82_000, color: "#ed9cba" },
  { id: "savings", name: "Fondo de emergencia", institution: "Meta de ahorro", currency: "MXN", openingBalance: 28_500, color: "#d39aff" },
];

export const DEMO_BUDGETS: DemoBudget[] = [
  { id: "budget-home", categoryId: "home", limit: 20_000 },
  { id: "budget-groceries", categoryId: "groceries", limit: 5_000 },
  { id: "budget-transport", categoryId: "transport", limit: 4_200 },
  { id: "budget-dining", categoryId: "dining", limit: 4_000 },
  { id: "budget-health", categoryId: "health", limit: 2_200 },
  { id: "budget-subscriptions", categoryId: "subscriptions", limit: 800 },
];

const demoCategoryById = new Map(DEMO_CATEGORIES.map((category) => [category.id, category]));

/** Historical goals are fictional, but shaped like the real append-only budget history. */
export const DEMO_HISTORICAL_BUDGETS = DEMO_BUDGETS.map((budget, index) => {
  const category = demoCategoryById.get(budget.categoryId);
  const earlierLimit = Math.round(budget.limit * (index % 2 === 0 ? 0.88 : 1.12));
  return {
    _id: budget.id,
    name: category?.name || "Presupuesto",
    budgetType: "spending",
    isSaving: false,
    period: "monthly",
    category: budget.categoryId,
    categories: [{ category: { _id: category?.id, name: category?.name, icon: category?.icon, color: category?.color } }],
    goalAmount: budget.limit,
    currency: "MXN",
    createdAt: "2024-11-01T00:00:00.000Z",
    history: [
      { goalAmount: earlierLimit, effectiveFrom: "2024-11-01T00:00:00.000Z", effectiveTo: "2025-06-30T23:59:59.999Z" },
      { goalAmount: budget.limit, effectiveFrom: "2025-07-01T00:00:00.000Z", effectiveTo: null },
    ],
  };
});

export const DEMO_PROJECT: DemoProject = {
  id: "japan-trip",
  name: "Viaje a Japón",
  icon: "fluent/airplane",
  startDate: "2026-10-01",
  endDate: "2027-01-31",
  target: 260_000,
  currency: "MXN",
};

export const DEMO_SAVINGS_GOAL: DemoSavingsGoal = {
  id: "emergency-fund",
  name: "Fondo de emergencia",
  target: 80_000,
  currency: "MXN",
  accountId: "savings",
  targetDate: "2027-06-30",
};

const monthKeys = Array.from({ length: 24 }, (_, index) => {
  const month = new Date(Date.UTC(2024, 10 + index, 1));
  return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
});

function dateInMonth(monthKey: string, day: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${monthKey}-${String(Math.min(day, new Date(Date.UTC(year, month, 0)).getUTCDate())).padStart(2, "0")}`;
}

function makeTransaction(
  month: string,
  id: string,
  day: number,
  description: string,
  type: DemoMovementType,
  categoryId: string | undefined,
  accountId: string,
  amount: number,
  currency: DemoCurrency,
  options: Partial<Pick<DemoTransaction, "note" | "projectId" | "transferPeerAccountId" | "transferPeerAmount" | "transferPeerCurrency">> = {},
): DemoTransaction {
  return {
    id,
    date: dateInMonth(month, day),
    description,
    type,
    categoryId,
    accountId,
    nativeAmount: amount,
    nativeCurrency: currency,
    reportAmount: Math.round(amount * DEMO_RATES_TO_MXN[currency]),
    ...options,
  };
}

function buildCurrentMonth(month: string): DemoTransaction[] {
  const rows: Array<[number, string, DemoMovementType, string | undefined, string, number, DemoCurrency, Partial<Pick<DemoTransaction, "note" | "projectId">>?]> = [
    [1, "Nómina quincenal", "income", "income", "bbva", 32_500, "MXN"],
    [2, "Renta departamento", "expense", "home", "bbva", 18_500, "MXN"],
    [3, "Súper La Comer", "expense", "groceries", "bbva", 2_480, "MXN"],
    [4, "Uber al trabajo", "expense", "transport", "bbva", 184, "MXN"],
    [5, "Cena con amigos", "expense", "dining", "bbva", 890, "MXN"],
    [6, "Internet y teléfono", "expense", "utilities", "bbva", 1_150, "MXN"],
    [7, "Música y streaming", "expense", "subscriptions", "bbva", 249, "MXN"],
    [8, "Farmacia San Pablo", "expense", "health", "bbva", 425, "MXN"],
    [10, "Gasolina", "expense", "transport", "bbva", 1_820, "MXN"],
    [11, "Vuelo a Tokio", "expense", "travel", "bbva", 24_770, "MXN", { projectId: DEMO_PROJECT.id, note: "Vuelo de ida · ejemplo de gasto vinculado al proyecto" }],
    [12, "Hotel en Kioto", "expense", "travel", "bbva", 3_850, "MXN", { projectId: DEMO_PROJECT.id }],
    [14, "Comida de fin de semana", "expense", "groceries", "bbva", 1_940, "MXN"],
    [15, "Sushi de ejemplo", "expense", "dining", "japan", 1_800, "JPY", { projectId: DEMO_PROJECT.id }],
    [16, "Compra de supermercado", "expense", "groceries", "bbva", 1_620, "MXN"],
    [18, "Taxi al aeropuerto", "expense", "transport", "bbva", 460, "MXN", { projectId: DEMO_PROJECT.id }],
    [19, "Cine", "expense", "entertainment", "bbva", 640, "MXN"],
    [20, "Almuerzo", "expense", "dining", "bbva", 1_120, "MXN"],
    [21, "Consulta médica", "expense", "health", "bbva", 980, "MXN"],
    [22, "Almacenamiento en la nube", "expense", "subscriptions", "revolut", 2.99, "USD"],
    [24, "Nómina quincenal", "income", "income", "bbva", 32_500, "MXN"],
    [3, "Café de especialidad", "expense", "dining", "bbva", 95, "MXN"],
    [6, "Papelería", "expense", "home", "bbva", 285, "MXN"],
    [9, "Corte de cabello", "expense", "health", "bbva", 450, "MXN"],
    [13, "Plataforma de video", "expense", "subscriptions", "revolut", 6.99, "USD"],
    [15, "Supermercado de barrio", "expense", "groceries", "bbva", 580, "MXN"],
    [17, "Estacionamiento", "expense", "transport", "bbva", 80, "MXN"],
    [18, "Accesorios para el viaje", "expense", "travel", "bbva", 1_200, "MXN", { projectId: DEMO_PROJECT.id }],
    [20, "Reembolso de seguro", "income", "income", "bbva", 2_200, "MXN"],
    [21, "Gas doméstico", "expense", "utilities", "bbva", 370, "MXN"],
    [22, "Compra en librería local", "expense", undefined, "bbva", 680, "MXN"],
    [23, "Desayuno de trabajo", "expense", "dining", "bbva", 245, "MXN"],
    [24, "Recarga celular", "expense", "utilities", "bbva", 200, "MXN"],
    [25, "Farmacia", "expense", "health", "bbva", 230, "MXN"],
    [26, "Comida para llevar", "expense", "dining", "bbva", 310, "MXN"],
  ];
  return [
    ...rows.map((row, index) => makeTransaction(month, `oct-${index + 1}`, ...row)),
    makeTransaction(month, "oct-transfer-1", 17, "Apartado para gastos del viaje", "transfer", undefined, "bbva", 1_825, "MXN", {
      transferPeerAccountId: "revolut",
      transferPeerAmount: 100,
      transferPeerCurrency: "USD",
      note: "Movimiento entre cuentas; no cuenta como ingreso ni gasto.",
    }),
    makeTransaction(month, "oct-transfer-2", 18, "Aporte al fondo de emergencia", "transfer", undefined, "bbva", 4_000, "MXN", {
      transferPeerAccountId: "savings",
      transferPeerAmount: 4_000,
      transferPeerCurrency: "MXN",
      note: "Ahorro separado del gasto mensual.",
    }),
  ];
}

function buildPreviousMonth(month: string): DemoTransaction[] {
  const rows: Array<[number, string, DemoMovementType, string | undefined, string, number, DemoCurrency, Partial<Pick<DemoTransaction, "note" | "projectId">>?]> = [
    [1, "Nómina quincenal", "income", "income", "bbva", 32_500, "MXN"],
    [2, "Renta departamento", "expense", "home", "bbva", 18_500, "MXN"],
    [4, "Súper La Comer", "expense", "groceries", "bbva", 3_400, "MXN"],
    [7, "Gasolina", "expense", "transport", "bbva", 2_100, "MXN"],
    [10, "Restaurante", "expense", "dining", "bbva", 2_350, "MXN"],
    [12, "Nómina quincenal", "income", "income", "bbva", 32_500, "MXN"],
    [15, "Servicio de luz", "expense", "utilities", "bbva", 840, "MXN"],
    [18, "Farmacia", "expense", "health", "bbva", 550, "MXN"],
    [20, "Suscripción", "expense", "subscriptions", "revolut", 8.99, "USD"],
    [23, "Café y comida", "expense", "dining", "bbva", 1_460, "MXN"],
    [25, "Compra para el hogar", "expense", "groceries", "bbva", 1_850, "MXN"],
    [27, "Transporte", "expense", "transport", "bbva", 1_130, "MXN"],
    [6, "Café y pan", "expense", "dining", "bbva", 180, "MXN"],
    [17, "Recarga de transporte", "expense", "transport", "bbva", 250, "MXN"],
    [28, "Compra de farmacia", "expense", "health", "bbva", 320, "MXN"],
  ];
  return rows.map((row, index) => makeTransaction(month, `sep-${index + 1}`, ...row));
}

function buildOlderMonth(month: string, offset: number): DemoTransaction[] {
  const base = [
    { day: 1, description: "Nómina", type: "income" as const, category: "income", amount: 31_000 + (offset % 4) * 500 },
    { day: 2, description: "Renta", type: "expense" as const, category: "home", amount: 17_500 + (offset % 5) * 250 },
    { day: 5, description: "Supermercado", type: "expense" as const, category: "groceries", amount: 3_200 + (offset % 6) * 160 },
    { day: 9, description: "Traslados", type: "expense" as const, category: "transport", amount: 1_900 + (offset % 5) * 100 },
    { day: 13, description: "Comida", type: "expense" as const, category: "dining", amount: 1_450 + (offset % 4) * 180 },
    { day: 16, description: "Servicios", type: "expense" as const, category: "utilities", amount: 950 + (offset % 3) * 90 },
    { day: 20, description: "Consulta", type: "expense" as const, category: "health", amount: 420 + (offset % 4) * 80 },
    { day: 25, description: "Nómina", type: "income" as const, category: "income", amount: 31_000 + (offset % 4) * 500 },
    { day: 11, description: "Seguro del auto", type: "expense" as const, category: "transport", amount: 780 + (offset % 3) * 50 },
    { day: 22, description: "Suscripción digital", type: "expense" as const, category: "subscriptions", amount: 199 + (offset % 3) * 20 },
  ];
  return base.map((item, index) => {
    const useForeignAccount = index === 6 && offset % 3 === 0;
    const accountId = useForeignAccount ? "japan" : "bbva";
    const currency: DemoCurrency = useForeignAccount ? "JPY" : "MXN";
    const amount = useForeignAccount ? Math.round(item.amount * 8) : item.amount;
    return makeTransaction(month, `past-${offset}-${index}`, item.day, item.description, item.type, item.category, accountId, amount, currency);
  });
}

function buildSeed(): DemoSeed {
  const transactions: DemoTransaction[] = [];
  monthKeys.forEach((month, index) => {
    if (month === "2026-10") transactions.push(...buildCurrentMonth(month));
    else if (month === "2026-09") transactions.push(...buildPreviousMonth(month));
    else transactions.push(...buildOlderMonth(month, index));
  });

  return {
    accounts: DEMO_ACCOUNTS,
    categories: DEMO_CATEGORIES,
    budgets: DEMO_BUDGETS,
    project: DEMO_PROJECT,
    savingsGoal: DEMO_SAVINGS_GOAL,
    transactions,
    months: monthKeys,
  };
}

export const DEMO_SEED = buildSeed();
export const DEMO_STORAGE_KEY = "gastify-demo:v1";

export function formatDemoMoney(amount: number, currency: DemoCurrency = "MXN", withCode = false): string {
  const formatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
    minimumFractionDigits: currency === "JPY" ? 0 : 0,
  }).format(amount);
  return withCode ? `${formatted} ${currency}` : formatted;
}

export function getDemoAccountBalance(account: DemoAccount, transactions: DemoTransaction[]): number {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === "transfer") {
      if (transaction.accountId === account.id) return balance - transaction.nativeAmount;
      if (transaction.transferPeerAccountId === account.id) return balance + (transaction.transferPeerAmount ?? transaction.reportAmount / DEMO_RATES_TO_MXN[account.currency]);
      return balance;
    }
    if (transaction.accountId !== account.id) return balance;
    return balance + (transaction.type === "income" ? transaction.nativeAmount : -transaction.nativeAmount);
  }, account.openingBalance);
}

export function getDemoMonthLabel(monthKey: string, options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }): string {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-MX", { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toLocaleUpperCase("es-MX") + label.slice(1);
}
