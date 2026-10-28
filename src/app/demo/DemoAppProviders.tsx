"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider, useSelector } from "react-redux";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme } from "antd";
import { rootReducer } from "@/lib/rootReducer";
import type { RootState } from "@/lib/store";
import { AllDataContext } from "@/components/Providers/AllDataProvider";
import { isBlockedDemoRequest } from "@/lib/demo/networkFence";
import {
  DEMO_ACCOUNTS,
  DEMO_CATEGORIES,
  DEMO_DEFAULT_CATEGORIES,
  DEMO_DEFAULT_SUBCATEGORIES,
  DEMO_PROJECT,
  DEMO_SAVINGS_GOAL,
  DEMO_SEED,
  DEMO_SUBCATEGORIES,
  getDemoAccountBalance,
} from "@/lib/demo/demoData";

function DemoNetworkFence() {
  // Install before child passive effects run, so session hooks or legacy
  // readers cannot send requests while the demo is mounting.
  useLayoutEffect(() => {
    const originalFetch = window.fetch;
    const guardedFetch: typeof window.fetch = (input, init) => {
      if (isBlockedDemoRequest(input, window.location.href)) {
        return Promise.reject(new Error("La demostración usa datos ficticios y no consulta la API de Gastify."));
      }
      return originalFetch.call(window, input, init);
    };
    window.fetch = guardedFetch;
    return () => {
      if (window.fetch === guardedFetch) window.fetch = originalFetch;
    };
  }, []);
  return null;
}

function DemoAllDataBridge({ children }: { children: ReactNode }): React.JSX.Element {
  const user = useSelector((state: RootState) => state.userReducer.data);
  const wallet = useSelector((state: RootState) => state.walletReducer.data);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const categories = useSelector((state: RootState) => state.categoriesReducer.data);
  const subCategories = useSelector((state: RootState) => state.subCategoryReducer.data);
  const transacciones = useSelector((state: RootState) => state.transacctionsReducer.data);
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);

  return (
    <AllDataContext.Provider value={{ user, wallet, accounts, categories, subCategories, transacciones, budgets, loading: false }}>
      {children}
    </AllDataContext.Provider>
  );
}

const categoryIcons: Record<string, string> = {
  home: "fluent/house",
  groceries: "fluent/leafy-green",
  transport: "fluent/bus",
  dining: "fluent/fork-and-knife",
  health: "fluent/pill",
  subscriptions: "fluent/laptop",
  travel: "fluent/airplane",
  entertainment: "fluent/party-popper",
  utilities: "fluent/light-bulb",
  income: "fluent/money-bag",
  education: "md/MdSchool",
  pets: "fa/FaDog",
  "personal-care": "fa/FaBath",
  shopping: "gi/GiClothes",
  gifts: "gi/GiPresent",
  taxes: "md/MdAccountBalance",
  insurance: "md/MdHealthAndSafety",
};

const DEMO_STORAGE_VERSION = 3;
const DEMO_TAB_ID_KEY = "gastify-public-demo-tab-id";

interface DemoSnapshot {
  user?: Record<string, unknown>;
  wallet?: Record<string, unknown>;
  accounts?: Record<string, unknown>[];
  categories?: Record<string, unknown>[];
  defaultCategories?: Record<string, unknown>[];
  subCategories?: Record<string, unknown>[];
  defaultSubCategories?: Record<string, unknown>[];
  transactions?: Record<string, unknown>[];
  budgets?: Record<string, unknown>[];
}

function getDemoStorageKey(): string {
  let tabId = window.sessionStorage.getItem(DEMO_TAB_ID_KEY);
  if (!tabId) {
    tabId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(DEMO_TAB_ID_KEY, tabId);
  }
  return `gastify:public-demo:v${DEMO_STORAGE_VERSION}:${tabId}`;
}

function readDemoSnapshot(storageKey: string): DemoSnapshot | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "null") as { version?: number; data?: unknown } | null;
    if (parsed?.version !== DEMO_STORAGE_VERSION || !parsed.data || typeof parsed.data !== "object") return null;
    const data = parsed.data as DemoSnapshot;
    return {
      user: data.user && typeof data.user === "object" ? data.user : undefined,
      wallet: data.wallet && typeof data.wallet === "object" ? data.wallet : undefined,
      accounts: Array.isArray(data.accounts) ? data.accounts : undefined,
      categories: Array.isArray(data.categories) ? data.categories : undefined,
      defaultCategories: Array.isArray(data.defaultCategories) ? data.defaultCategories : undefined,
      subCategories: Array.isArray(data.subCategories) ? data.subCategories : undefined,
      defaultSubCategories: Array.isArray(data.defaultSubCategories) ? data.defaultSubCategories : undefined,
      transactions: Array.isArray(data.transactions) ? data.transactions : undefined,
      budgets: Array.isArray(data.budgets) ? data.budgets : undefined,
    };
  } catch {
    return null;
  }
}

function snapshotFromStore(store: ReturnType<typeof makeDemoStore>): DemoSnapshot {
  const state = store.getState();
  return {
    user: state.userReducer.data as Record<string, unknown>,
    wallet: state.walletReducer.data as Record<string, unknown>,
    accounts: state.accountsReducer.data as Record<string, unknown>[],
    categories: state.categoriesReducer.data.user as Record<string, unknown>[],
    defaultCategories: state.categoriesReducer.data.default as Record<string, unknown>[],
    subCategories: state.subCategoryReducer.data.subCat as Record<string, unknown>[],
    defaultSubCategories: state.subCategoryReducer.data.default as Record<string, unknown>[],
    transactions: state.transacctionsReducer.data as Record<string, unknown>[],
    budgets: state.budgetReducer.data as Record<string, unknown>[],
  };
}

function makeDemoStore(snapshot: DemoSnapshot | null = null) {
  const initial = rootReducer(undefined, { type: "demo/initialize" });
  const categories = DEMO_CATEGORIES.map((category) => ({
    _id: category.id,
    name: category.name,
    icon: categoryIcons[category.id] || "md/MdOutlineCategory",
    color: category.color,
    isDefaultCatego: false,
  }));
  const defaultCategories = DEMO_DEFAULT_CATEGORIES.map((category) => ({
    _id: category.id,
    name: category.name,
    icon: categoryIcons[category.id] || category.icon,
    color: category.color,
    isDefaultCatego: true,
  }));
  const allCategories = [...categories, ...defaultCategories];
  const categoryById = new Map(allCategories.map((category) => [category._id, category]));
  const subcategories = DEMO_SUBCATEGORIES.map((subcategory) => ({
    _id: subcategory.id,
    name: subcategory.name,
    icon: subcategory.icon,
    color: subcategory.color,
    isDefaultSubCatego: false,
    fatherCategory: categoryById.get(subcategory.categoryId),
  }));
  const defaultSubcategories = DEMO_DEFAULT_SUBCATEGORIES.map((subcategory) => ({
    _id: subcategory.id,
    name: subcategory.name,
    icon: subcategory.icon,
    color: subcategory.color,
    isDefaultSubCatego: true,
    fatherCategory: categoryById.get(subcategory.categoryId),
  }));
  const accounts = DEMO_ACCOUNTS.map((account, order) => ({
    _id: account.id,
    name: account.name,
    institution: account.institution,
    currency: account.currency,
    accountType: account.id === "savings" ? "savings" : "debit",
    amount: getDemoAccountBalance(account, DEMO_SEED.transactions),
    order,
    cardColor: account.color,
  }));
  const accountById = new Map(accounts.map((account) => [account._id, account]));
  const transactions = DEMO_SEED.transactions.map((movement) => {
    const category = movement.categoryId ? categoryById.get(movement.categoryId) : undefined;
    const account = accountById.get(movement.accountId);
    const description = movement.description.toLocaleLowerCase();
    const subcategoryId = movement.categoryId === "home"
      ? description.includes("renta") ? "home-rent" : "home-household"
      : movement.categoryId === "groceries"
        ? description.includes("café") || description.includes("cafe") ? "groceries-coffee" : "groceries-market"
        : movement.categoryId === "transport"
          ? description.includes("gasolina") ? "transport-fuel" : "transport-rides"
          : movement.categoryId === "dining"
            ? description.includes("café") || description.includes("cafe") ? "dining-coffee" : "dining-restaurants"
            : movement.categoryId === "health"
              ? description.includes("farmacia") ? "health-pharmacy" : "health-care"
              : movement.categoryId === "travel"
                ? description.includes("vuelo") ? "travel-flights" : description.includes("hotel") ? "travel-lodging" : "travel-local"
                : movement.categoryId === "subscriptions" ? "subscriptions-digital"
                  : movement.categoryId === "utilities" ? "utilities-home" : undefined;
    const subCategory = [...subcategories, ...defaultSubcategories].find((item) => item._id === subcategoryId);
    const primaryMinor = Math.round(movement.reportAmount * 100);
    const nativeMinor = Math.round(movement.nativeAmount * (movement.nativeCurrency === "JPY" ? 1 : 100));
    const isExpense = movement.type === "expense";
    const isIncome = movement.type === "income";
    return {
      _id: movement.id,
      name: movement.description,
      amount: movement.reportAmount,
      isBill: isExpense,
      isIncome,
      isReadable: true,
      date: `${movement.date}T12:00:00.000Z`,
      createdAt: `${movement.date}T12:00:00.000Z`,
      account,
      category: category || null,
      subCategory: subCategory || null,
      budget: movement.projectId || undefined,
      tags: [],
      kind: movement.type,
      direction: isIncome ? "credit" : "debit",
      state: "completed",
      notes: movement.note,
      displayMoney: {
        primary: { amountMinor: primaryMinor, currency: "MXN" },
        native: { amountMinor: nativeMinor, currency: movement.nativeCurrency },
        merchant: { amountMinor: nativeMinor, currency: movement.nativeCurrency },
      },
      money: {
        account: { amountMinor: nativeMinor, currency: movement.nativeCurrency },
        merchant: { amountMinor: nativeMinor, currency: movement.nativeCurrency },
        reporting: { amountMinor: primaryMinor, currency: "MXN" },
      },
      transferGroupId: movement.type === "transfer" ? `demo-${movement.id}` : null,
      transferDirection: movement.type === "transfer" ? "out" : null,
    };
  });

  const projectBudget = {
    _id: DEMO_PROJECT.id,
    name: DEMO_PROJECT.name,
    icon: "md/MdFlightTakeoff",
    budgetType: "project",
    isSaving: false,
    goalAmount: DEMO_PROJECT.target,
    currency: DEMO_PROJECT.currency,
    eventStartDate: DEMO_PROJECT.startDate,
    eventEndDate: DEMO_PROJECT.endDate,
    linkedTags: [],
    linkedAccounts: [],
    categories: [],
    history: [],
  };
  const spendingBudgets = DEMO_SEED.budgets.map((budget) => ({
    _id: budget.id,
    name: categoryById.get(budget.categoryId)?.name,
    budgetType: "spending",
    isSaving: false,
    goalAmount: budget.limit,
    currency: "MXN",
    period: "monthly",
    category: budget.categoryId,
    // BudgetBarRow consumes the same populated reference that the authenticated
    // dashboard receives. Passing only the category id drops its icon/color.
    categories: [{ category: categoryById.get(budget.categoryId) }],
    history: [],
  }));
  const savingBudget = {
    _id: DEMO_SAVINGS_GOAL.id,
    name: DEMO_SAVINGS_GOAL.name,
    budgetType: "saving",
    isSaving: true,
    goalAmount: DEMO_SAVINGS_GOAL.target,
    savingAmount: accounts.find((account) => account._id === DEMO_SAVINGS_GOAL.accountId)?.amount || 0,
    currency: DEMO_SAVINGS_GOAL.currency,
    period: "monthly",
    history: [],
  };

  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initial,
      userReducer: { data: snapshot?.user || { _id: "demo-user", fullName: "Alex Rivera", mail: "alex@example.test", image: "/img/profile/user-non-profile.jpg", phone: "+52 55 0000 0000" }, status: "succeeded", error: null },
      walletReducer: { data: snapshot?.wallet || { _id: "demo-wallet", name: "Mi cartera", primaryCurrency: "MXN", budget: {} }, status: "succeeded", error: null },
      accountsReducer: { data: snapshot?.accounts || accounts, status: "succeeded", error: null },
      categoriesReducer: { data: { user: snapshot?.categories?.length ? snapshot.categories : categories, default: snapshot?.defaultCategories?.length ? snapshot.defaultCategories : defaultCategories }, status: "succeeded", error: null },
      subCategoryReducer: { data: { subCat: snapshot?.subCategories?.length ? snapshot.subCategories : subcategories, default: snapshot?.defaultSubCategories?.length ? snapshot.defaultSubCategories : defaultSubcategories }, status: "succeeded", error: null },
      transacctionsReducer: { data: snapshot?.transactions || transactions, status: "succeeded", error: null, historyStatus: "complete", historyCutoff: null },
      budgetReducer: { data: snapshot?.budgets || [savingBudget, ...spendingBudgets, projectBudget], status: "succeeded", error: null },
    },
  });
}

/** A private, per-visitor Redux store containing only fixed fictional fixtures. */
export default function DemoAppProviders({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ReturnType<typeof makeDemoStore> | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-theme");
    root.removeAttribute("data-theme");
    const storageKey = getDemoStorageKey();
    const demoStore = makeDemoStore(readDemoSnapshot(storageKey));
    const saveDemoData = () => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ version: DEMO_STORAGE_VERSION, data: snapshotFromStore(demoStore) }));
      } catch {
        // The demo continues from its in-memory sample if browser storage is unavailable.
      }
    };
    const clearDemoData = () => {
      try { window.localStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
    };
    const unsubscribe = demoStore.subscribe(saveDemoData);
    saveDemoData();
    window.addEventListener("pagehide", clearDemoData);
    window.addEventListener("beforeunload", clearDemoData);
    setStore(demoStore);
    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", clearDemoData);
      window.removeEventListener("beforeunload", clearDemoData);
      clearDemoData();
      if (previousTheme) root.setAttribute("data-theme", previousTheme);
      else root.removeAttribute("data-theme");
    };
  }, []);
  if (!store) return <div role="status" className="demo-loading"><span className="demo-loading-mark">G</span>Preparando datos de ejemplo…</div>;
  return <AntdRegistry><ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: "#a879f4", colorBgContainer: "#241a36", colorText: "#f4efff", borderRadius: 12 } }}><Provider store={store}><DemoNetworkFence /><DemoAllDataBridge>{children}</DemoAllDataBridge></Provider></ConfigProvider></AntdRegistry>;
}
