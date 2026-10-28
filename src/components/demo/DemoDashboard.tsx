"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  FiActivity, FiArrowDownRight, FiArrowRight, FiArrowUpRight, FiBarChart2,
  FiCheck, FiChevronDown, FiChevronLeft, FiChevronRight, FiCreditCard,
  FiEdit2, FiFilter, FiHome, FiLayers, FiPlus, FiRefreshCw, FiSearch,
  FiTarget, FiTrendingUp, FiX,
} from "react-icons/fi";
import {
  DEMO_ACCOUNTS, DEMO_BUDGETS, DEMO_CATEGORIES, DEMO_PROJECT, DEMO_RATES_TO_MXN, DEMO_SAVINGS_GOAL,
  DEMO_SEED, DEMO_STORAGE_KEY, formatDemoMoney, getDemoAccountBalance,
  getDemoMonthLabel, type DemoCurrency, type DemoMovementType, type DemoTransaction,
} from "@/lib/demo/demoData";
import { selectBudgetSpend, selectCategoryTotals, selectMonthSummary, selectMonthlySpending, selectProjectSpend, selectUnbudgetedCategories } from "@/lib/demo/demoSelectors";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";

interface StoredDemoState {
  version: 1;
  additions: DemoTransaction[];
  overrides: Record<string, Partial<DemoTransaction>>;
}

const emptyStorageState: StoredDemoState = { version: 1, additions: [], overrides: {} };
const currencyLabels: Record<DemoCurrency, string> = { MXN: "Pesos mexicanos", USD: "Dólares", EUR: "Euros", JPY: "Yenes" };

function isValidStoredState(value: unknown): value is StoredDemoState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredDemoState>;
  const isTransaction = (transaction: unknown): transaction is DemoTransaction => {
    if (!transaction || typeof transaction !== "object") return false;
    const item = transaction as Partial<DemoTransaction>;
    return typeof item.id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date ?? "")
      && typeof item.description === "string" && ["expense", "income", "transfer"].includes(item.type ?? "")
      && DEMO_ACCOUNTS.some((account) => account.id === item.accountId)
      && typeof item.nativeAmount === "number" && Number.isFinite(item.nativeAmount) && item.nativeAmount >= 0
      && ["MXN", "USD", "EUR", "JPY"].includes(item.nativeCurrency ?? "")
      && typeof item.reportAmount === "number" && Number.isFinite(item.reportAmount) && item.reportAmount >= 0;
  };
  return candidate.version === 1
    && Array.isArray(candidate.additions) && candidate.additions.every(isTransaction)
    && !!candidate.overrides && typeof candidate.overrides === "object" && !Array.isArray(candidate.overrides)
    && Object.entries(candidate.overrides).every(([id, override]) => !!id && !!override && typeof override === "object" && !Array.isArray(override) && ((override as Partial<DemoTransaction>).id === undefined || (override as Partial<DemoTransaction>).id === id));
}

function monthDifference(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function getChangeLabel(change: number | null): string {
  if (change === null) return "Sin periodo anterior";
  if (Math.abs(change) < 0.5) return "Prácticamente igual";
  return `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(0)} % vs. mes anterior`;
}

function readStoredState(): StoredDemoState {
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return emptyStorageState;
    const parsed: unknown = JSON.parse(raw);
    return isValidStoredState(parsed) ? parsed : emptyStorageState;
  } catch {
    return emptyStorageState;
  }
}

function getNativeReportAmount(amount: number, currency: DemoCurrency): number {
  return Math.round(amount * DEMO_RATES_TO_MXN[currency]);
}

function txAmountLabel(transaction: DemoTransaction): string {
  if (transaction.type === "transfer") return `↔ ${formatDemoMoney(transaction.nativeAmount, transaction.nativeCurrency)}`;
  const prefix = transaction.type === "income" ? "+" : "−";
  return `${prefix}${formatDemoMoney(transaction.nativeAmount, transaction.nativeCurrency)}`;
}

function categoryFor(id?: string) {
  return DEMO_CATEGORIES.find((category) => category.id === id);
}

function DemoMark() {
  return <span className="demo-brand-mark" aria-hidden="true">G</span>;
}

function PercentDelta({ value, increasesAreGood = false }: { value: number | null; increasesAreGood?: boolean }) {
  const positive = value !== null && value > 0;
  const favorable = value === null ? "is-neutral" : ((positive && increasesAreGood) || (!positive && !increasesAreGood) ? "is-good" : "is-bad");
  return <span className={`demo-delta ${favorable}`}>
    {value === null ? null : positive ? <FiArrowUpRight aria-hidden="true" /> : <FiArrowDownRight aria-hidden="true" />}
    {getChangeLabel(value)}
  </span>;
}

function DashboardNav({ activeSection }: { activeSection: string }) {
  const links = [
    { id: "panorama", label: "Panorama", icon: <FiHome aria-hidden="true" /> },
    { id: "movimientos", label: "Movimientos", icon: <FiActivity aria-hidden="true" /> },
    { id: "presupuestos", label: "Presupuestos", icon: <FiBarChart2 aria-hidden="true" /> },
    { id: "proyecto", label: "Proyectos", icon: <FiTarget aria-hidden="true" /> },
  ];
  return <aside className="demo-sidebar" aria-label="Navegación de la demo">
    <Link href="/" className="demo-brand" prefetch={false}><DemoMark /><span>Gastify</span></Link>
    <div className="demo-sidebar-label">TU ESPACIO</div>
    <nav>{links.map((link) => <a key={link.id} href={`#${link.id}`} className={activeSection === link.id ? "is-active" : ""}>{link.icon}<span>{link.label}</span></a>)}</nav>
    <div className="demo-sidebar-bottom"><span className="demo-sidebar-dot" /> Datos ficticios<br /><small>Exploración local</small></div>
  </aside>;
}

interface EditorValues {
  description: string;
  amount: string;
  date: string;
  accountId: string;
  categoryId: string;
  type: "expense" | "income";
  note: string;
  projectId?: string;
}

const emptyEditor: EditorValues = { description: "", amount: "", date: "2026-10-25", accountId: "bbva", categoryId: "groceries", type: "expense", note: "" };

export default function DemoDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(DEMO_SEED.months[DEMO_SEED.months.length - 1]);
  const [activeSection, setActiveSection] = useState("panorama");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [additions, setAdditions] = useState<DemoTransaction[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<DemoTransaction>>>({});
  const [hydrated, setHydrated] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorValues>(emptyEditor);
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredState();
    setAdditions(stored.additions);
    setOverrides(stored.overrides);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ version: 1, additions, overrides } satisfies StoredDemoState));
    } catch {
      setNotice("El navegador no pudo guardar este ejemplo localmente.");
    }
  }, [additions, overrides, hydrated]);

  useEffect(() => {
    if (!editorOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setEditorOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("demo-modal-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("demo-modal-open");
    };
  }, [editorOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-demo-section]"));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-18% 0px -65% 0px", threshold: [0, 0.25, 0.55] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const transactions = useMemo(() => [
    ...DEMO_SEED.transactions.map((transaction) => ({ ...transaction, ...overrides[transaction.id] })),
    ...additions.map((transaction) => ({ ...transaction, ...overrides[transaction.id] })),
  ], [additions, overrides]);
  const currentMonthIndex = DEMO_SEED.months.indexOf(selectedMonth);
  const previousMonth = currentMonthIndex > 0 ? DEMO_SEED.months[currentMonthIndex - 1] : null;
  const currentSummary = useMemo(() => selectMonthSummary(transactions, selectedMonth), [transactions, selectedMonth]);
  const previousSummary = useMemo(() => previousMonth ? selectMonthSummary(transactions, previousMonth) : null, [transactions, previousMonth]);
  const currentTransactions = currentSummary.transactions;
  const expenses = currentSummary.expenses;
  const spending = currentSummary.spending;
  const income = currentSummary.income;
  const balance = currentSummary.balance;
  const previousSpending = previousSummary?.spending ?? 0;
  const previousIncome = previousSummary?.income ?? 0;
  const spendingChange = monthDifference(spending, previousSpending);
  const incomeChange = monthDifference(income, previousIncome);
  const categoryTotals = useMemo(() => selectCategoryTotals(expenses, DEMO_CATEGORIES), [expenses]);
  const unbudgetedCategories = selectUnbudgetedCategories(categoryTotals, DEMO_BUDGETS);
  const unbudgetedTotal = unbudgetedCategories.reduce((total, category) => total + category.amount, 0);
  const topCategories = categoryTotals.slice(0, 5);
  const sortedTransactions = [...currentTransactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const filteredTransactions = sortedTransactions.filter((transaction) => {
    const category = categoryFor(transaction.categoryId)?.name ?? "Transferencia";
    const matchesSearch = `${transaction.description} ${category} ${transaction.note ?? ""}`.toLocaleLowerCase("es-MX").includes(search.toLocaleLowerCase("es-MX"));
    return matchesSearch && (categoryFilter === "all" || transaction.categoryId === categoryFilter);
  });
  const sixMonthSpending = DEMO_SEED.months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map((month) => ({
    month,
    amount: selectMonthlySpending(transactions, month),
  }));
  const maxTrend = Math.max(1, ...sixMonthSpending.map((item) => item.amount));
  const projectSpent = selectProjectSpend(transactions, DEMO_PROJECT.id);
  const projectPercent = Math.min(100, (projectSpent / DEMO_PROJECT.target) * 100);
  const savingsAccount = DEMO_ACCOUNTS.find((account) => account.id === DEMO_SAVINGS_GOAL.accountId)!;
  const savingsAmount = getDemoAccountBalance(savingsAccount, transactions);
  const savingsPercent = Math.min(100, (savingsAmount / DEMO_SAVINGS_GOAL.target) * 100);

  function openCreateEditor() {
    setEditingId(null);
    setEditor({ ...emptyEditor, date: `${selectedMonth}-25` });
    setEditorOpen(true);
  }

  function openEditEditor(transaction: DemoTransaction) {
    if (transaction.type === "transfer") {
      setNotice("Las transferencias de ejemplo mueven saldo entre cuentas y no cuentan como gasto ni ingreso.");
      return;
    }
    setEditingId(transaction.id);
    setEditor({
      description: transaction.description,
      amount: String(transaction.nativeAmount),
      date: transaction.date,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId ?? "groceries",
      type: transaction.type,
      note: transaction.note ?? "",
      projectId: transaction.projectId,
    });
    setEditorOpen(true);
  }

  function submitEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(editor.amount);
    const account = DEMO_ACCOUNTS.find((item) => item.id === editor.accountId);
    if (!account || !Number.isFinite(amount) || amount <= 0 || !editor.description.trim()) return;
    const transaction: DemoTransaction = {
      id: editingId ?? `demo-${Date.now()}`,
      date: editor.date,
      description: editor.description.trim(),
      type: editor.type as DemoMovementType,
      accountId: editor.accountId,
      categoryId: editor.categoryId,
      nativeAmount: amount,
      nativeCurrency: account.currency,
      reportAmount: getNativeReportAmount(amount, account.currency),
      note: editor.note.trim() || undefined,
      projectId: editor.type === "expense" ? editor.projectId : undefined,
    };
    if (editingId) setOverrides((current) => ({ ...current, [editingId]: transaction }));
    else setAdditions((current) => [...current, transaction]);
    setSelectedMonth(editor.date.slice(0, 7));
    setSearch("");
    setCategoryFilter("all");
    setEditorOpen(false);
    setNotice(editingId ? "Movimiento de ejemplo actualizado." : "Movimiento de ejemplo agregado. Los totales ya están actualizados.");
  }

  function resetDemo() {
    setAdditions([]);
    setOverrides({});
    setSearch("");
    setCategoryFilter("all");
    try { window.localStorage.removeItem(DEMO_STORAGE_KEY); } catch { /* local-only reset */ }
    setNotice("Demo restablecida a sus datos originales.");
  }

  function shiftMonth(direction: -1 | 1) {
    const next = currentMonthIndex + direction;
    if (next >= 0 && next < DEMO_SEED.months.length) setSelectedMonth(DEMO_SEED.months[next]);
    setCategoryFilter("all");
  }

  const mobileNavigation = [
    { id: "panorama", label: "Inicio", icon: <FiHome aria-hidden="true" /> },
    { id: "movimientos", label: "Movimientos", icon: <FiActivity aria-hidden="true" /> },
    { id: "presupuestos", label: "Budgets", icon: <FiBarChart2 aria-hidden="true" /> },
    { id: "proyecto", label: "Proyecto", icon: <FiTarget aria-hidden="true" /> },
  ];

  return <div className="demo-app">
    <DashboardNav activeSection={activeSection} />
    <div className="demo-main-column">
      <div className="demo-notice-bar"><div><span className="demo-notice-dot" /> Estás explorando datos ficticios <span className="demo-notice-secondary">· tus cambios viven sólo en este navegador</span></div><div className="demo-notice-actions"><button type="button" onClick={resetDemo}><FiRefreshCw aria-hidden="true" /> Restablecer</button><Link href="/register" prefetch={false}>Usar mis datos <FiArrowRight aria-hidden="true" /></Link></div></div>
      <header className="demo-mobile-header"><button className="demo-mobile-brand" type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-label="Abrir navegación"><DemoMark /><span>Gastify</span><FiChevronDown aria-hidden="true" /></button><button className="demo-mobile-add" type="button" onClick={openCreateEditor} aria-label="Agregar movimiento de ejemplo"><FiPlus aria-hidden="true" /></button></header>
      {mobileMenuOpen && <nav className="demo-mobile-menu is-open" aria-label="Navegación móvil">{[["panorama", "Panorama"], ["movimientos", "Movimientos"], ["presupuestos", "Presupuestos"], ["proyecto", "Proyectos"]].map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)}>{label}</a>)}</nav>}
      <div className="demo-content">
        <section className="demo-section" id="panorama" data-demo-section aria-labelledby="demo-title">
          <div className="demo-page-heading"><div><span className="demo-eyebrow">TU ESPACIO FINANCIERO</span><h1 id="demo-title">Tu panorama</h1><p>Todo lo que entra, sale y se queda contigo, en una sola vista.</p></div><div className="demo-heading-actions"><button type="button" className="demo-secondary-button" onClick={openCreateEditor}><FiPlus aria-hidden="true" /> Agregar movimiento</button><Link className="demo-primary-button" href="/register" prefetch={false}>Empieza con tus datos <FiArrowRight aria-hidden="true" /></Link></div></div>
          <div className="demo-period-row"><div className="demo-period-control"><button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior" disabled={currentMonthIndex <= 0}><FiChevronLeft aria-hidden="true" /></button><label htmlFor="demo-month">{getDemoMonthLabel(selectedMonth)}</label><select id="demo-month" value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setCategoryFilter("all"); }} aria-label="Seleccionar mes">{DEMO_SEED.months.map((month) => <option value={month} key={month}>{getDemoMonthLabel(month)}</option>)}</select><FiChevronDown className="demo-period-chevron" aria-hidden="true" /><button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente" disabled={currentMonthIndex >= DEMO_SEED.months.length - 1}><FiChevronRight aria-hidden="true" /></button></div><span className="demo-period-caption">Comparado con {previousMonth ? getDemoMonthLabel(previousMonth, { month: "short" }) : "—"}</span></div>
          <div className="demo-summary-grid">
            <article className="demo-summary-card demo-total-card"><div className="demo-card-label"><span>Ingresos</span><span className="demo-summary-icon income-icon"><FiArrowDownRight aria-hidden="true" /></span></div><strong>{formatDemoMoney(income)}</strong><PercentDelta value={incomeChange} increasesAreGood /></article>
            <article className="demo-summary-card"><div className="demo-card-label"><span>Gastos</span><span className="demo-summary-icon expense-icon"><FiArrowUpRight aria-hidden="true" /></span></div><strong>{formatDemoMoney(spending)}</strong><PercentDelta value={spendingChange} /></article>
            <article className="demo-summary-card"><div className="demo-card-label"><span>Balance del mes</span><span className="demo-summary-icon balance-icon"><FiActivity aria-hidden="true" /></span></div><strong className={balance >= 0 ? "demo-positive" : "demo-negative"}>{formatDemoMoney(balance)}</strong><span className="demo-muted-caption">Ingresos menos gastos del periodo</span></article>
          </div>
          <div className="demo-accounts-grid" aria-label="Cuentas de ejemplo">{DEMO_ACCOUNTS.map((account) => {
            const accountBalance = getDemoAccountBalance(account, transactions);
            const reportBalance = Math.round(accountBalance * DEMO_RATES_TO_MXN[account.currency]);
            return <article className="demo-account-card" key={account.id}><div className="demo-account-top"><span className="demo-account-icon" style={{ "--account-color": account.color } as React.CSSProperties}><FiCreditCard aria-hidden="true" /></span><span className="demo-account-institution">{account.institution}</span><button type="button" aria-label={`Detalle ilustrativo de ${account.name}`} title="Saldo de ejemplo"><FiChevronDown aria-hidden="true" /></button></div><span className="demo-account-name">{account.name}</span><strong>{formatDemoMoney(accountBalance, account.currency)} <small>{account.currency}</small></strong>{account.currency !== "MXN" && <span className="demo-account-equivalent">≈ {formatDemoMoney(reportBalance)} MXN en reportes</span>}</article>;
          })}</div>
          <article className="demo-analyzer-card"><div className="demo-analyzer-copy"><div className="demo-analyzer-icon"><FiTrendingUp aria-hidden="true" /></div><div><span className="demo-eyebrow">WALLET ANALYZER</span><h2>Tu gasto en contexto</h2><p>En estos seis meses has gastado <strong>{formatDemoMoney(sixMonthSpending.reduce((sum, item) => sum + item.amount, 0))}</strong>. La categoría con más movimiento es <strong>{topCategories[0]?.name ?? "—"}</strong>.</p><div className="demo-analyzer-facts"><span><FiLayers aria-hidden="true" /> {currentTransactions.length} movimientos este mes</span><span><FiActivity aria-hidden="true" /> {unbudgetedCategories.length} categorías sin presupuesto</span></div></div></div><div className="demo-trend-chart" role="img" aria-label={`Gastos mensuales de los últimos ${sixMonthSpending.length} meses`}>
            <div className="demo-trend-top"><span>Gastos · últimos meses</span><strong>{formatDemoMoney(spending)}</strong></div><div className="demo-trend-bars">{sixMonthSpending.map((item) => <div className="demo-trend-column" key={item.month}><span className="demo-trend-value" title={formatDemoMoney(item.amount)} style={{ height: `${Math.max(8, (item.amount / maxTrend) * 100)}%` }} /><small>{getDemoMonthLabel(item.month, { month: "short" }).slice(0, 3)}</small></div>)}</div></div></article>
        </section>

        <section className="demo-section" id="categorias" data-demo-section aria-labelledby="demo-categories-title">
          <div className="demo-section-heading"><div><span className="demo-eyebrow">EN QUÉ SE FUE</span><h2 id="demo-categories-title">Tus gastos por categoría</h2></div><span className="demo-section-total">{formatDemoMoney(spending)} <small>MXN</small></span></div>
          <div className="demo-two-column">
            <article className="demo-panel demo-category-panel"><div className="demo-panel-heading"><div><strong>Distribución del periodo</strong><span>Selecciona una categoría para filtrar movimientos</span></div><button type="button" className="demo-icon-button" onClick={() => { setCategoryFilter("all"); document.getElementById("movimientos")?.scrollIntoView({ behavior: "smooth" }); }} aria-label="Ver todos los movimientos"><FiArrowRight aria-hidden="true" /></button></div>
              <div className="demo-category-content"><div className="demo-donut-wrap"><div className="demo-donut" style={{ background: `conic-gradient(${categoryTotals.map((category, index) => `${category.color} ${categoryTotals.slice(0, index).reduce((start, prior) => start + (prior.amount / Math.max(1, spending)) * 100, 0)}% ${categoryTotals.slice(0, index + 1).reduce((start, current) => start + (current.amount / Math.max(1, spending)) * 100, 0)}%`).join(", ")})` }}><div><strong>{categoryTotals.length}</strong><span>categorías</span></div></div></div><div className="demo-category-list">{categoryTotals.slice(0, 6).map((category) => <button type="button" className="demo-category-line" key={category.id} onClick={() => { setCategoryFilter(category.id); document.getElementById("movimientos")?.scrollIntoView({ behavior: "smooth" }); }}><span className="demo-category-dot" style={{ background: category.color }} /><span>{category.name}</span><b>{formatDemoMoney(category.amount)}</b><small>{spending ? Math.round((category.amount / spending) * 100) : 0}%</small></button>)}</div></div>
            </article>
            <article className="demo-panel demo-top-panel"><div className="demo-panel-heading"><div><strong>Top categorías</strong><span>Las que más pesaron en {getDemoMonthLabel(selectedMonth, { month: "long" })}</span></div><span className="demo-top-mark">TOP 5</span></div><div className="demo-top-list">{topCategories.map((category, index) => <button type="button" className="demo-top-row" key={category.id} onClick={() => { setCategoryFilter(category.id); document.getElementById("movimientos")?.scrollIntoView({ behavior: "smooth" }); }}><span className="demo-top-rank">0{index + 1}</span><span className="demo-top-category"><i style={{ background: category.color }} />{category.name}<small>{category.count} {category.count === 1 ? "movimiento" : "movimientos"}</small></span><span className="demo-top-amount">{formatDemoMoney(category.amount)}<small>{spending ? Math.round((category.amount / spending) * 100) : 0}% del gasto</small></span></button>)}</div></article>
          </div>
        </section>

        <section className="demo-section" id="presupuestos" data-demo-section aria-labelledby="demo-budgets-title">
          <div className="demo-section-heading"><div><span className="demo-eyebrow">PLANEA TU MES</span><h2 id="demo-budgets-title">Presupuestos</h2></div><span className="demo-section-caption">El avance se calcula con los movimientos de ejemplo</span></div>
          <div className="demo-budget-grid">{DEMO_BUDGETS.map((budget) => {
            const category = categoryFor(budget.categoryId)!;
            const amount = selectBudgetSpend(expenses, budget);
            const percent = Math.round((amount / budget.limit) * 100);
            const state = percent >= 100 ? "over" : percent >= 80 ? "warning" : "good";
            return <article className={`demo-budget-card is-${state}`} key={budget.id}><div className="demo-budget-card-head"><span className="demo-category-icon" style={{ "--category-color": category.color } as React.CSSProperties}><UniversalCategoIcon type={category.icon} siz={24} /></span><span className="demo-budget-mood" aria-label={state === "over" ? "Presupuesto superado" : state === "warning" ? "Cerca del límite" : "Dentro del presupuesto"}>{state === "over" ? "🔥" : state === "warning" ? "😬" : "🙂"}</span></div><strong>{category.name}</strong><div className="demo-budget-values"><b>{formatDemoMoney(amount)}</b><span>de {formatDemoMoney(budget.limit)}</span></div><div className="demo-progress-track" role="progressbar" aria-label={`${category.name}: ${percent}% del presupuesto`} aria-valuenow={Math.min(percent, 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(percent, 100)}%` }} /></div><div className="demo-budget-footer"><span>{percent}% usado</span><span>{percent >= 100 ? "Límite superado" : percent >= 80 ? "Vas cerca del límite" : `${formatDemoMoney(Math.max(0, budget.limit - amount))} disponibles`}</span></div></article>;
          })}</div>
          <article className="demo-unbudgeted-card"><div className="demo-unbudgeted-heading"><div className="demo-unbudgeted-icon"><FiFilter aria-hidden="true" /></div><div><span className="demo-eyebrow">AÚN SIN LÍMITE ASIGNADO</span><h3>Gastos no contemplados</h3><p>Estos gastos también cuentan. Puedes revisar sus movimientos y decidir si quieres crearles un presupuesto.</p></div><strong>{formatDemoMoney(unbudgetedTotal)}</strong></div><div className="demo-unbudgeted-list">{unbudgetedCategories.length ? unbudgetedCategories.map((category) => <button type="button" key={category.id} onClick={() => { setCategoryFilter(category.id); document.getElementById("movimientos")?.scrollIntoView({ behavior: "smooth" }); }}><span className="demo-category-icon" style={{ "--category-color": category.color } as React.CSSProperties}><UniversalCategoIcon type={category.icon} siz={20} /></span><span>{category.name}<small>{category.count} {category.count === 1 ? "movimiento" : "movimientos"}</small></span><b>{formatDemoMoney(category.amount)}</b><FiChevronRight aria-hidden="true" /></button>) : <span className="demo-muted-caption">No hay gastos sin presupuesto en este periodo.</span>}</div></article>
        </section>

        <section className="demo-section" id="proyecto" data-demo-section aria-labelledby="demo-project-title">
          <div className="demo-section-heading"><div><span className="demo-eyebrow">UNA META CON PLAN</span><h2 id="demo-project-title">Proyecto destacado</h2></div><span className="demo-section-caption">Fechas y gastos vinculados</span></div>
          <article className="demo-project-card"><div className="demo-project-orbit"><span><UniversalCategoIcon type={DEMO_PROJECT.icon} siz={28} /></span></div><div className="demo-project-main"><div className="demo-project-label">PROYECTO DE EJEMPLO</div><h3>{DEMO_PROJECT.name}</h3><p>Un viaje planeado con gastos reales y costos que todavía estás preparando.</p><div className="demo-project-dates"><span>Inicio <b>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${DEMO_PROJECT.startDate}T12:00:00Z`))}</b></span><span>Fin <b>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${DEMO_PROJECT.endDate}T12:00:00Z`))}</b></span></div></div><div className="demo-project-progress"><div className="demo-project-spent"><span>Gasto vinculado</span><strong>{formatDemoMoney(projectSpent)}</strong><small>de {formatDemoMoney(DEMO_PROJECT.target)} MXN planeados</small></div><div className="demo-progress-track"><span style={{ width: `${projectPercent}%` }} /></div><div className="demo-project-progress-foot"><span>{Math.round(projectPercent)}% del plan</span><span>{formatDemoMoney(Math.max(0, DEMO_PROJECT.target - projectSpent))} por delante</span></div><button type="button" onClick={() => { setCategoryFilter("travel"); document.getElementById("movimientos")?.scrollIntoView({ behavior: "smooth" }); }}>Ver movimientos del proyecto <FiArrowRight aria-hidden="true" /></button></div></article>
          <article className="demo-savings-card"><div className="demo-savings-icon"><FiTarget aria-hidden="true" /></div><div className="demo-savings-main"><span className="demo-eyebrow">META DE AHORRO</span><h3>{DEMO_SAVINGS_GOAL.name}</h3><p>Una meta separada de tus presupuestos de gasto.</p><span className="demo-savings-date">Objetivo · {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${DEMO_SAVINGS_GOAL.targetDate}T12:00:00Z`))}</span></div><div className="demo-savings-progress"><div className="demo-project-spent"><span>Ahorrado</span><strong>{formatDemoMoney(savingsAmount)}</strong><small>de {formatDemoMoney(DEMO_SAVINGS_GOAL.target)} MXN</small></div><div className="demo-progress-track"><span style={{ width: `${savingsPercent}%` }} /></div><div className="demo-project-progress-foot"><span>{Math.round(savingsPercent)}% de la meta</span><span>{formatDemoMoney(Math.max(0, DEMO_SAVINGS_GOAL.target - savingsAmount))} por reunir</span></div></div></article>
        </section>

        <section className="demo-section demo-movements-section" id="movimientos" data-demo-section aria-labelledby="demo-movements-title">
          <div className="demo-section-heading"><div><span className="demo-eyebrow">ACTIVIDAD DEL PERIODO</span><h2 id="demo-movements-title">Movimientos</h2></div><button type="button" className="demo-secondary-button" onClick={openCreateEditor}><FiPlus aria-hidden="true" /> Agregar</button></div>
          <article className="demo-panel demo-movements-panel"><div className="demo-movement-toolbar"><label className="demo-search"><FiSearch aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca por nombre o categoría" aria-label="Buscar movimientos" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda"><FiX aria-hidden="true" /></button>}</label><label className="demo-filter"><FiFilter aria-hidden="true" /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrar por categoría"><option value="all">Todas las categorías</option>{DEMO_CATEGORIES.filter((category) => category.id !== "income").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><FiChevronDown aria-hidden="true" /></label></div><div className="demo-movement-summary"><span>{filteredTransactions.length} movimientos</span><span><i className="income-dot" /> Ingresos <b>+{formatDemoMoney(income)}</b></span><span><i className="expense-dot" /> Gastos <b>−{formatDemoMoney(spending)}</b></span></div>
            <div className="demo-movement-list">{filteredTransactions.length ? filteredTransactions.map((transaction) => {
              const category = categoryFor(transaction.categoryId);
              const account = DEMO_ACCOUNTS.find((item) => item.id === transaction.accountId);
              const date = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${transaction.date}T12:00:00Z`));
              return <button type="button" className="demo-movement-row" key={transaction.id} onClick={() => openEditEditor(transaction)} aria-label={`Editar ${transaction.description}, ${txAmountLabel(transaction)}`}><span className="demo-movement-category-icon" style={{ "--category-color": category?.color ?? "#a88aff" } as React.CSSProperties}>{transaction.type === "transfer" ? <FiRefreshCw aria-hidden="true" /> : <UniversalCategoIcon type={category?.icon} siz={19} />}</span><span className="demo-movement-description"><strong>{transaction.description}</strong><small>{category?.name ?? "Transferencia"} · {account?.name ?? "Cuenta"}{transaction.projectId ? " · Viaje a Japón" : ""}</small></span><span className={`demo-movement-amount is-${transaction.type}`}>{txAmountLabel(transaction)}<small>{date}{transaction.nativeCurrency !== "MXN" ? ` · ${transaction.nativeCurrency} · ≈ ${formatDemoMoney(transaction.reportAmount)} MXN` : ""}</small></span><FiEdit2 className="demo-movement-edit" aria-hidden="true" /></button>;
            }) : <div className="demo-empty-state"><FiSearch aria-hidden="true" /><strong>No encontramos movimientos</strong><span>Prueba otro término o cambia los filtros.</span></div>}</div>
          </article>
        </section>
        <footer className="demo-footer"><span><DemoMark /> Gastify · Demo local</span><span>Ejemplo visual, no es una cuenta real.</span><Link href="/register" prefetch={false}>Crea tu cuenta <FiArrowRight aria-hidden="true" /></Link></footer>
      </div>
      <nav className="demo-bottom-nav" aria-label="Secciones principales">{mobileNavigation.map(({ id, icon, label }) => <a key={id} href={`#${id}`} className={activeSection === id ? "is-active" : ""}>{icon}<span>{label}</span></a>)}</nav>
    </div>
    <div className="demo-live-region" role="status" aria-live="polite">{notice}</div>
    {editorOpen && (
      <div className="demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
        <section className="demo-editor-modal" role="dialog" aria-modal="true" aria-labelledby="demo-editor-title">
          <header><div><span className="demo-eyebrow">SÓLO EN ESTA DEMO</span><h2 id="demo-editor-title">{editingId ? "Edita un movimiento" : "Agrega un movimiento"}</h2></div><button type="button" className="demo-icon-button" onClick={() => setEditorOpen(false)} aria-label="Cerrar"><FiX aria-hidden="true" /></button></header>
          <p className="demo-editor-note"><FiCheck aria-hidden="true" /> Este cambio sólo modifica los datos ficticios guardados en este navegador.</p>
          <form onSubmit={submitEditor}>
            <label>Concepto<input required autoFocus maxLength={80} value={editor.description} onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))} placeholder="Ej. Café de la mañana" /></label>
            <div className="demo-editor-two">
              <label>Tipo<select value={editor.type} onChange={(event) => { const type = event.target.value as "expense" | "income"; setEditor((current) => ({ ...current, type, categoryId: type === "income" ? "income" : current.categoryId === "income" ? "groceries" : current.categoryId, projectId: type === "income" ? undefined : current.projectId })); }}><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label>
              <label>Monto<input required type="number" min="0.01" step="0.01" value={editor.amount} onChange={(event) => setEditor((current) => ({ ...current, amount: event.target.value }))} placeholder="0.00" /></label>
            </div>
            <div className="demo-editor-two">
              <label>Categoría<select value={editor.categoryId} onChange={(event) => setEditor((current) => ({ ...current, categoryId: event.target.value }))}>{editor.type === "income" ? <option value="income">Ingresos</option> : DEMO_CATEGORIES.filter((category) => category.id !== "income").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label>Cuenta<select value={editor.accountId} onChange={(event) => setEditor((current) => ({ ...current, accountId: event.target.value }))}>{DEMO_ACCOUNTS.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label>
            </div>
            <label>Fecha<input required type="date" min={`${DEMO_SEED.months[0]}-01`} max={`${DEMO_SEED.months[DEMO_SEED.months.length - 1]}-31`} value={editor.date} onChange={(event) => setEditor((current) => ({ ...current, date: event.target.value }))} /></label>
            <label>Nota <span className="demo-optional-label">(opcional)</span><textarea maxLength={220} rows={2} value={editor.note} onChange={(event) => setEditor((current) => ({ ...current, note: event.target.value }))} placeholder="Agrega contexto a este ejemplo" /></label>
            {editor.type === "expense" && <label className="demo-project-checkbox"><input type="checkbox" checked={editor.projectId === DEMO_PROJECT.id} onChange={(event) => setEditor((current) => ({ ...current, projectId: event.target.checked ? DEMO_PROJECT.id : undefined }))} /><span>Vincular a <strong>{DEMO_PROJECT.name}</strong><small>El gasto también actualizará el avance del proyecto.</small></span></label>}
            <div className="demo-editor-currency">Se registrará en {currencyLabels[DEMO_ACCOUNTS.find((account) => account.id === editor.accountId)?.currency ?? "MXN"]}. Los reportes usan una conversión fija de ejemplo.</div>
            <div className="demo-editor-actions"><button type="button" className="demo-secondary-button" onClick={() => setEditorOpen(false)}>Cancelar</button><button type="submit" className="demo-primary-button">{editingId ? "Guardar cambios" : "Agregar a la demo"} <FiArrowRight aria-hidden="true" /></button></div>
          </form>
        </section>
      </div>
    )}
    <div className="demo-floating-help"><FiCheck aria-hidden="true" /><span>Demo segura<br /><small>sin datos personales</small></span></div>
  </div>;
}
