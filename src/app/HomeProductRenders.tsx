import { FiArrowDownRight, FiArrowUpRight, FiBell, FiCalendar, FiCheck, FiChevronRight, FiCoffee, FiFilter, FiHeart, FiHome, FiMapPin, FiMonitor, FiSearch, FiShoppingCart, FiTag, FiTarget, FiTrendingUp, FiTruck } from "react-icons/fi";
import type { Locale } from "@gastify/core/i18n/locales";

function DemoWindow({ children, className = "", label, locale }: { children: React.ReactNode; className?: string; label: string; locale: Locale }) {
  const en = locale === "en";
  return <div className={`home-render-window ${className}`} aria-label={label}>
    <div className="home-render-chrome"><span className="home-render-brand"><b>G</b> Gastify</span><span className="home-render-chrome-dots" aria-hidden="true"><i /><i /><i /></span><span className="home-render-chrome-period">{en ? "October 2026" : "Octubre 2026"}</span></div>
    {children}
    <span className="home-render-disclaimer">{en ? "Illustrative interface · fictional data" : "Interfaz ilustrativa · datos ficticios"}</span>
  </div>;
}

const movements = [
  { name: "Súper La Comer", meta: "Despensa · Santander Débito", amount: "−$1,480.00", date: "21 OCT", icon: FiShoppingCart, tone: "mint" },
  { name: "Uber al trabajo", meta: "Transporte · BBVA Nómina", amount: "−$184.00", date: "20 OCT", icon: FiTruck, tone: "peach" },
  { name: "Cena con amigos", meta: "Restaurantes · Santander Débito", amount: "−$890.00", date: "19 OCT", icon: FiCoffee, tone: "rose" },
  { name: "Farmacia San Pablo", meta: "Salud · BBVA Nómina", amount: "−$425.00", date: "18 OCT", icon: FiHeart, tone: "blue" },
  { name: "Netflix", meta: "Suscripciones · BBVA Nómina", amount: "−$219.00", date: "17 OCT", icon: FiMonitor, tone: "violet" },
] as const;

export function MovementRender({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const movementMeta = en
    ? ["Groceries · Santander Debit", "Transport · BBVA Payroll", "Restaurants · Santander Debit", "Health · BBVA Payroll", "Subscriptions · BBVA Payroll"]
    : movements.map((movement) => movement.meta);
  return <DemoWindow locale={locale} className="home-render-movements" label={en ? "Illustrative recreation of the Gastify transactions page" : "Recreación ilustrativa de la página de movimientos de Gastify"}>
    <div className="home-render-body">
      <div className="home-render-title-row"><div><span className="home-render-overline">{en ? "YOUR FINANCES, IN DETAIL" : "TUS FINANZAS, EN DETALLE"}</span><h3>{en ? "Transactions" : "Movimientos"}</h3></div><span className="home-render-top-action"><FiFilter aria-hidden="true" /> {en ? "Filters" : "Filtros"}</span></div>
      <div className="home-render-toolbar"><span>←</span><strong>{en ? "October 2026" : "Octubre 2026"}</strong><span>→</span><span className="home-render-toolbar-pill">{en ? "All accounts" : "Todas las cuentas"}</span><span className="home-render-toolbar-pill">{en ? "All categories" : "Todas las categorías"}</span></div>
      <div className="home-render-search"><FiSearch aria-hidden="true" /> {en ? "Search by name, category or tag" : "Busca por nombre, categoría o etiqueta"}</div>
      <div className="home-render-summary"><span><b>21</b> {en ? "transactions" : "movimientos"}</span><span className="home-render-out"><FiArrowDownRight aria-hidden="true" /> {en ? "Spending" : "Gastos"} <b>−$30,860</b></span><span className="home-render-in"><FiArrowUpRight aria-hidden="true" /> {en ? "Income" : "Ingresos"} <b>+$85,000</b></span></div>
      <div className="home-render-movement-list">{movements.map(({ name, amount, date, icon: Icon, tone }, index) => <div className="home-render-movement" key={name}><span className={`home-render-movement-icon ${tone}`}><Icon aria-hidden="true" /></span><div className="home-render-movement-name"><strong>{name}</strong><small>{movementMeta[index]}</small></div><div className="home-render-movement-amount"><b>{amount}</b><small>{date}</small></div></div>)}</div>
    </div>
  </DemoWindow>;
}

export function ProjectRender({ locale }: { locale: Locale }) {
  const en = locale === "en";
  return <DemoWindow locale={locale} className="home-render-project" label={en ? "Illustrative recreation of a Gastify project budget" : "Recreación ilustrativa de un presupuesto de proyecto en Gastify"}>
    <div className="home-render-project-head"><div className="home-render-project-icon"><FiMapPin aria-hidden="true" /></div><div><span className="home-render-overline">{en ? "PROJECT BUDGET · MXN" : "PRESUPUESTO DE PROYECTO · MXN"}</span><h3>{en ? "Sample trip" : "Viaje de ejemplo"}</h3><p><FiCalendar aria-hidden="true" /> 01 Sep 2026 — 28 Feb 2027 <span>· {en ? "editable dates" : "fechas editables"}</span></p></div></div>
    <div className="home-render-project-body"><div className="home-render-project-stats"><div><span>{en ? "SPENT" : "GASTADO"}</span><strong>$6,337.50</strong></div><div><span>{en ? "LIMIT" : "LÍMITE"}</span><strong>$180,000.00</strong></div><div><span>{en ? "AVAILABLE" : "DISPONIBLE"}</span><strong>$173,662.50</strong></div></div>
      <div className="home-render-project-track"><span /></div><p className="home-render-project-progress">{en ? "4% used · linked expenses from any date count toward the project" : "4 % utilizado · contempla gastos vinculados desde cualquier fecha"}</p>
      <div className="home-render-project-tags"><span>{en ? "SUGGESTED TAGS" : "ETIQUETAS SUGERIDAS"}</span><b><FiTag aria-hidden="true" /> #sample-trip</b></div>
      <div className="home-render-project-actions"><span>{en ? "Edit project" : "Editar proyecto"}</span><span>{en ? "Link transaction" : "Vincular movimiento"}</span><span>{en ? "Create transaction" : "Crear movimiento"}</span></div>
      <div className="home-render-project-list-title"><strong>{en ? "Linked transactions" : "Movimientos vinculados"}</strong><span>2</span></div>
      <div className="home-render-project-movement"><div><strong>{en ? "Flight · deposit" : "Vuelo · anticipo"}</strong><small>28 Sep 2026</small></div><b>−$2,537.50</b></div>
      <div className="home-render-project-movement"><div><strong>{en ? "Hotel · reservation" : "Hospedaje · reserva"}</strong><small>27 Aug 2026</small></div><b>−$3,800.00</b></div>
    </div>
  </DemoWindow>;
}

const spendingBudgets = [
  { name: "Restaurantes", icon: FiCoffee, actual: "$4,450", limit: "$5,000", percent: 89, mood: "😬", tone: "warning" },
  { name: "Transporte", icon: FiTruck, actual: "$2,160", limit: "$2,000", percent: 100, mood: "🔥", tone: "over" },
  { name: "Casa", icon: FiHome, actual: "$3,200", limit: "$8,000", percent: 40, mood: "🙂", tone: "calm" },
] as const;

export function SpendingBudgetRender({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const budgetNames = en ? ["Restaurants", "Transport", "Home"] : spendingBudgets.map((budget) => budget.name);
  return <DemoWindow locale={locale} className="home-render-budget" label={en ? "Illustration of category budgets, alerts and unbudgeted spending" : "Recreación ilustrativa de presupuestos por categoría, avisos y gastos sin presupuesto"}>
    <div className="home-render-body">
      <div className="home-render-title-row"><div><span className="home-render-overline">{en ? "SPENDING BUDGETS" : "PRESUPUESTOS DE GASTO"}</span><h3>{en ? "Stay on track this month" : "Cuida el ritmo del mes"}</h3></div><span className="home-render-top-action">{en ? "October 2026" : "Octubre 2026"} ⌄</span></div>
      <div className="home-budget-summary"><div><small>{en ? "PLANNED" : "PLANIFICADO"}</small><strong>$15,000</strong></div><div><small>{en ? "SPENT" : "GASTADO"}</small><strong>$9,810</strong></div><div><small>{en ? "UNASSIGNED" : "SIN ASIGNAR"}</small><strong>{en ? "2 categories" : "2 categorías"}</strong></div></div>
      <div className="home-budget-list" aria-label={en ? "Fictional category budget examples" : "Ejemplos ficticios de presupuestos por categoría"}>
        {spendingBudgets.map(({ icon: Icon, ...budget }, index) => <div className={`home-budget-row ${budget.tone}`} key={budget.name}>
          <div className="home-budget-row-top"><span className="home-budget-category-icon"><Icon aria-hidden="true" /></span><strong>{budgetNames[index]}</strong><span className="home-budget-mood" aria-label={en ? `${budget.percent}% used` : `${budget.percent}% usado`}>{budget.mood}</span><b>{budget.percent}%</b></div>
          <div className="home-budget-track" role="progressbar" aria-label={`${budgetNames[index]}: ${budget.percent}% ${en ? "of limit" : "del límite"}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={budget.percent}><i style={{ width: `${budget.percent}%` }} /></div>
          <div className="home-budget-row-bottom"><span>{budget.actual} {en ? "of" : "de"} {budget.limit}</span><span>{budget.percent >= 100 ? (en ? "Over budget" : "Sobrepasado") : (en ? "of limit" : "del límite")}</span></div>
        </div>)}
      </div>
      <div className="home-budget-alert"><span className="home-budget-alert-icon"><FiBell aria-hidden="true" /></span><div><strong>{en ? "80% of your budget" : "80 % de tu presupuesto"}</strong><small>{en ? "Gastify lets you know when you are getting close to your limit." : "Un aviso dentro de Gastify cuando te acercas al límite."}</small></div><FiChevronRight aria-hidden="true" /></div>
    </div>
  </DemoWindow>;
}

export function SavingsGoalRender({ locale }: { locale: Locale }) {
  const en = locale === "en";
  return <DemoWindow locale={locale} className="home-render-savings" label={en ? "Illustration of a savings goal with progress and celebrations" : "Recreación ilustrativa de una meta de ahorro con progreso y celebraciones"}>
    <div className="home-render-savings-head"><span className="home-render-savings-icon"><FiTarget aria-hidden="true" /></span><div><span className="home-render-overline">{en ? "SAVINGS GOAL · MXN" : "META DE AHORRO · MXN"}</span><h3>{en ? "Trip fund" : "Fondo para un viaje"}</h3><p>{en ? "Your goal, separate from everyday spending." : "Tu meta, separada del gasto cotidiano."}</p></div><span className="home-render-savings-menu" aria-hidden="true">•••</span></div>
    <div className="home-render-savings-body">
      <div className="home-savings-total"><div><small>{en ? "SAVED" : "AHORRADO"}</small><strong>$68,000</strong></div><div><small>{en ? "GOAL" : "META"}</small><strong>$100,000</strong></div></div>
      <div className="home-savings-progress-label"><span>{en ? "You are on track" : "Vas en buen camino"}</span><strong>68 %</strong></div>
      <div className="home-savings-track" role="progressbar" aria-label={en ? "Fictional savings goal progress: 68%" : "Progreso ficticio de la meta de ahorro: 68%"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={68}><i /></div>
      <div className="home-savings-account"><span className="home-savings-account-icon">$</span><span><strong>{en ? "Linked account" : "Cuenta vinculada"}</strong><small>{en ? "The balance helps track progress toward your goal." : "El saldo ayuda a seguir el avance de tu meta."}</small></span><FiChevronRight aria-hidden="true" /></div>
      <div className="home-savings-milestones"><span>25 %</span><i /><span>50 %</span><i /><span className="is-next">75 %</span><i /><span>100 %</span></div>
      <div className="home-savings-celebration"><span aria-hidden="true">🎆</span><div><strong>{en ? "Every step counts!" : "¡Cada avance cuenta!"}</strong><small>{en ? "Milestones and celebrations as you reach your goal." : "Hitos y celebración cuando alcanzas tu objetivo."}</small></div><FiTrendingUp aria-hidden="true" /></div>
    </div>
  </DemoWindow>;
}

export function WalletAnalyzerRender({ locale }: { locale: Locale }) {
  const en = locale === "en";
  return <DemoWindow locale={locale} className="home-render-analyzer" label={en ? "Illustrative Wallet Analyzer with comparisons, trends, top categories and insights" : "Recreación ilustrativa del Wallet Analyzer con comparativas, tendencias, top categorías e insights"}>
    <div className="home-render-body">
      <div className="home-render-title-row"><div><span className="home-render-overline">{en ? "MORE THAN A TOTAL" : "MÁS QUE UN TOTAL"}</span><h3>Wallet Analyzer</h3></div><span className="home-render-top-action"><FiCalendar aria-hidden="true" /> {en ? "October 2026" : "Octubre 2026"}</span></div>
      <div className="home-analyzer-headline"><span>{en ? "THIS MONTH'S HIGHLIGHTS" : "LO MÁS DESTACADO DEL MES"}</span><strong>{en ? "One limit exceeded · one category down · one new subscription" : "Un límite rebasado · una categoría bajó · una suscripción nueva"}</strong><small>{en ? "Insights calculated from your history." : "Insights calculados a partir de tu historial."}</small></div>
      <div className="home-analyzer-kpis"><div><small>{en ? "SPENDING" : "GASTOS"}</small><strong>$30,950</strong><span className="negative">↑ 17 % {en ? "vs. last month" : "vs. mes anterior"}</span></div><div><small>{en ? "INCOME" : "INGRESOS"}</small><strong>$85,000</strong><span className="positive">↑ 8 % {en ? "vs. last month" : "vs. mes anterior"}</span></div><div><small>{en ? "SAVINGS RATE" : "TASA DE AHORRO"}</small><strong>36 %</strong><span>{en ? "Month-over-month" : "Comparación mensual"}</span></div></div>
      <div className="home-analyzer-grid">
        <div className="home-analyzer-panel home-analyzer-chart"><div className="home-analyzer-panel-heading"><strong>{en ? "Trend · 6 months" : "Tendencia · 6 meses"}</strong><span><i className="expense" /> {en ? "Spending" : "Gastos"} <i className="income" /> {en ? "Income" : "Ingresos"}</span></div><div className="home-analyzer-bars" role="img" aria-label={en ? "Fictional income and spending chart over six months" : "Gráfica ficticia de ingresos y gastos durante seis meses"}>{[44, 58, 48, 70, 61, 82].map((value, index) => <div className="home-analyzer-bar-group" key={index}><span className="income" style={{ height: `${value + 12}%` }} /><span className="expense" style={{ height: `${value}%` }} /><small>{["MAY", "JUN", "JUL", "AUG", "SEP", "OCT"][index]}</small></div>)}</div></div>
        <div className="home-analyzer-panel home-analyzer-top"><div className="home-analyzer-panel-heading"><strong>{en ? "Top categories" : "Top categorías"}</strong><span>3 · 6 · 12 · 24</span></div>{[["1", en ? "Home" : "Casa", "$18,500"], ["2", en ? "Groceries" : "Despensa", "$6,840"], ["3", en ? "Transport" : "Transporte", "$3,260"]].map(([rank, name, amount]) => <div className="home-analyzer-rank" key={rank}><span>{rank}</span><strong>{name}</strong><b>{amount}</b></div>)}</div>
      </div>
      <div className="home-analyzer-modules"><span><FiCheck aria-hidden="true" /> {en ? "Budgets and streaks" : "Presupuestos y rachas"}</span><span><FiCheck aria-hidden="true" /> {en ? "Large expenses" : "Grandes gastos"}</span><span><FiCheck aria-hidden="true" /> {en ? "Subscriptions" : "Suscripciones"}</span><span><FiCheck aria-hidden="true" /> {en ? "Currencies and spending pace" : "Divisas y ritmo de gasto"}</span></div>
    </div>
  </DemoWindow>;
}

export function HistoryRender({ locale }: { locale: Locale }) {
  const en = locale === "en";
  return <DemoWindow locale={locale} className="home-render-history" label={en ? "Illustrative recreation of Gastify comparison history" : "Recreación ilustrativa del historial comparativo de Gastify"}>
    <div className="home-render-body"><div className="home-render-title-row"><div><span className="home-render-overline">{en ? "YOUR STORY, IN PERSPECTIVE" : "TU HISTORIA, CON PERSPECTIVA"}</span><h3>{en ? "History" : "Historial"}</h3></div><span className="home-render-top-action"><FiCalendar aria-hidden="true" /> {en ? "Year 2026" : "Año 2026"} ⌄</span></div>
      <div className="home-history-controls"><span>{en ? "Month" : "Mes"}</span><span>{en ? "Quarter" : "Trimestre"}</span><span className="is-active">{en ? "Year" : "Año"}</span><span>{en ? "Range" : "Rango"}</span><b>{en ? "Compare" : "Comparar"} ✓</b></div>
      <div className="home-history-comparison"><div><small>2025 · JAN–OCT</small><strong>$248,600</strong><span>{en ? "Period spending" : "Gasto del periodo"}</span></div><span className="home-history-vs">VS.</span><div className="current"><small>2026 · JAN–OCT</small><strong>$231,480</strong><span>{en ? "Period spending" : "Gasto del periodo"}</span></div><div className="home-history-delta"><FiTrendingUp aria-hidden="true" /><strong>−7 %</strong><small>{en ? "vs. same period" : "vs. mismo periodo"}</small></div></div>
      <div className="home-history-lower"><div className="home-history-chart-wrap"><div className="home-analyzer-panel-heading"><strong>{en ? "Spending by quarter" : "Gastos por trimestre"}</strong><span>{en ? "Income and spending" : "Ingresos y gastos"}</span></div><div className="home-history-chart" role="img" aria-label={en ? "Fictional quarterly income and spending chart" : "Gráfica ficticia de gastos e ingresos por trimestre"}>{[["Q1", 62, 84], ["Q2", 48, 78], ["Q3", 72, 90], ["Q4", 55, 74]].map(([quarter, expense, income]) => <div className="home-history-quarter" key={quarter}><div><i className="expense" style={{ height: `${expense}%` }} /><i className="income" style={{ height: `${income}%` }} /></div><small>{quarter}</small></div>)}</div></div>
        <div className="home-history-tops"><div className="home-analyzer-panel-heading"><strong>{en ? "Top categories · up to 6" : "Top categorías · hasta 6"}</strong><span>{en ? "view details" : "ver detalle"} ↗</span></div>{[[en ? "Home" : "Casa", "$72,400"], [en ? "Travel" : "Viajes", "$43,800"], [en ? "Food" : "Comida", "$31,250"]].map(([name, amount], index) => <div className="home-history-top-row" key={name}><span>{index + 1}</span><strong>{name}</strong><b>{amount}</b></div>)}<div className="home-history-footnote"><FiCheck aria-hidden="true" /> {en ? "Compare categories, budgets and transactions." : "Compara categorías, presupuestos y movimientos."}</div></div></div>
      <div className="home-render-history-legend"><span><i className="expense" /> {en ? "Spending" : "Gastos"}</span><span><i className="income" /> {en ? "Income" : "Ingresos"}</span><span className="home-render-history-insight"><FiCheck aria-hidden="true" /> {en ? "Month, quarter, year or custom range" : "Mes, trimestre, año o rango personalizado"}</span></div>
    </div>
  </DemoWindow>;
}
