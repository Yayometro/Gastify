import { FiArrowDownRight, FiArrowUpRight, FiBell, FiCalendar, FiCheck, FiChevronRight, FiCoffee, FiFilter, FiHeart, FiHome, FiMapPin, FiMonitor, FiSearch, FiShoppingCart, FiTag, FiTarget, FiTrendingUp, FiTruck } from "react-icons/fi";

function DemoWindow({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) {
  return <div className={`home-render-window ${className}`} aria-label={label}>
    <div className="home-render-chrome"><span className="home-render-brand"><b>G</b> Gastify</span><span className="home-render-chrome-dots" aria-hidden="true"><i /><i /><i /></span><span className="home-render-chrome-period">Octubre 2026</span></div>
    {children}
    <span className="home-render-disclaimer">Interfaz ilustrativa · datos ficticios</span>
  </div>;
}

const movements = [
  { name: "Súper La Comer", meta: "Despensa · Santander Débito", amount: "−$1,480.00", date: "21 OCT", icon: FiShoppingCart, tone: "mint" },
  { name: "Uber al trabajo", meta: "Transporte · BBVA Nómina", amount: "−$184.00", date: "20 OCT", icon: FiTruck, tone: "peach" },
  { name: "Cena con amigos", meta: "Restaurantes · Santander Débito", amount: "−$890.00", date: "19 OCT", icon: FiCoffee, tone: "rose" },
  { name: "Farmacia San Pablo", meta: "Salud · BBVA Nómina", amount: "−$425.00", date: "18 OCT", icon: FiHeart, tone: "blue" },
  { name: "Netflix", meta: "Suscripciones · BBVA Nómina", amount: "−$219.00", date: "17 OCT", icon: FiMonitor, tone: "violet" },
] as const;

export function MovementRender() {
  return <DemoWindow className="home-render-movements" label="Recreación ilustrativa de la página de movimientos de Gastify">
    <div className="home-render-body">
      <div className="home-render-title-row"><div><span className="home-render-overline">TUS FINANZAS, EN DETALLE</span><h3>Movimientos</h3></div><span className="home-render-top-action"><FiFilter aria-hidden="true" /> Filtros</span></div>
      <div className="home-render-toolbar"><span>←</span><strong>Octubre 2026</strong><span>→</span><span className="home-render-toolbar-pill">Todas las cuentas</span><span className="home-render-toolbar-pill">Todas las categorías</span></div>
      <div className="home-render-search"><FiSearch aria-hidden="true" /> Busca por nombre, categoría o etiqueta</div>
      <div className="home-render-summary"><span><b>21</b> movimientos</span><span className="home-render-out"><FiArrowDownRight aria-hidden="true" /> Gastos <b>−$30,860</b></span><span className="home-render-in"><FiArrowUpRight aria-hidden="true" /> Ingresos <b>+$85,000</b></span></div>
      <div className="home-render-movement-list">{movements.map(({ name, meta, amount, date, icon: Icon, tone }) => <div className="home-render-movement" key={name}><span className={`home-render-movement-icon ${tone}`}><Icon aria-hidden="true" /></span><div className="home-render-movement-name"><strong>{name}</strong><small>{meta}</small></div><div className="home-render-movement-amount"><b>{amount}</b><small>{date}</small></div></div>)}</div>
    </div>
  </DemoWindow>;
}

export function ProjectRender() {
  return <DemoWindow className="home-render-project" label="Recreación ilustrativa de un presupuesto de proyecto en Gastify">
    <div className="home-render-project-head"><div className="home-render-project-icon"><FiMapPin aria-hidden="true" /></div><div><span className="home-render-overline">PROJECT BUDGET · MXN</span><h3>Viaje de ejemplo</h3><p><FiCalendar aria-hidden="true" /> 01 sep 2026 — 28 feb 2027 <span>· fechas editables</span></p></div></div>
    <div className="home-render-project-body"><div className="home-render-project-stats"><div><span>GASTADO</span><strong>$6,337.50</strong></div><div><span>LÍMITE</span><strong>$180,000.00</strong></div><div><span>DISPONIBLE</span><strong>$173,662.50</strong></div></div>
      <div className="home-render-project-track"><span /></div><p className="home-render-project-progress">4 % utilizado · contempla gastos vinculados desde cualquier fecha</p>
      <div className="home-render-project-tags"><span>ETIQUETAS SUGERIDAS</span><b><FiTag aria-hidden="true" /> #viaje-ejemplo</b></div>
      <div className="home-render-project-actions"><span>Editar proyecto</span><span>Vincular movimiento</span><span>Crear movimiento</span></div>
      <div className="home-render-project-list-title"><strong>Movimientos vinculados</strong><span>2</span></div>
      <div className="home-render-project-movement"><div><strong>Vuelo · anticipo</strong><small>28 sep 2026</small></div><b>−$2,537.50</b></div>
      <div className="home-render-project-movement"><div><strong>Hospedaje · reserva</strong><small>27 ago 2026</small></div><b>−$3,800.00</b></div>
    </div>
  </DemoWindow>;
}

const spendingBudgets = [
  { name: "Restaurantes", icon: FiCoffee, actual: "$4,450", limit: "$5,000", percent: 89, mood: "😬", tone: "warning" },
  { name: "Transporte", icon: FiTruck, actual: "$2,160", limit: "$2,000", percent: 100, mood: "🔥", tone: "over" },
  { name: "Casa", icon: FiHome, actual: "$3,200", limit: "$8,000", percent: 40, mood: "🙂", tone: "calm" },
] as const;

export function SpendingBudgetRender() {
  return <DemoWindow className="home-render-budget" label="Recreación ilustrativa de presupuestos por categoría, avisos y gastos sin presupuesto">
    <div className="home-render-body">
      <div className="home-render-title-row"><div><span className="home-render-overline">PRESUPUESTOS DE GASTO</span><h3>Cuida el ritmo del mes</h3></div><span className="home-render-top-action">Octubre 2026 ⌄</span></div>
      <div className="home-budget-summary"><div><small>PLANIFICADO</small><strong>$15,000</strong></div><div><small>GASTADO</small><strong>$9,810</strong></div><div><small>SIN ASIGNAR</small><strong>2 categorías</strong></div></div>
      <div className="home-budget-list" aria-label="Ejemplos ficticios de presupuestos por categoría">
        {spendingBudgets.map(({ icon: Icon, ...budget }) => <div className={`home-budget-row ${budget.tone}`} key={budget.name}>
          <div className="home-budget-row-top"><span className="home-budget-category-icon"><Icon aria-hidden="true" /></span><strong>{budget.name}</strong><span className="home-budget-mood" aria-label={`${budget.percent}% usado`}>{budget.mood}</span><b>{budget.percent}%</b></div>
          <div className="home-budget-track" role="progressbar" aria-label={`${budget.name}: ${budget.percent}% del límite`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={budget.percent}><i style={{ width: `${budget.percent}%` }} /></div>
          <div className="home-budget-row-bottom"><span>{budget.actual} de {budget.limit}</span><span>{budget.percent >= 100 ? "Sobrepasado" : "del límite"}</span></div>
        </div>)}
      </div>
      <div className="home-budget-alert"><span className="home-budget-alert-icon"><FiBell aria-hidden="true" /></span><div><strong>80 % de tu presupuesto</strong><small>Un aviso dentro de Gastify cuando te acercas al límite.</small></div><FiChevronRight aria-hidden="true" /></div>
    </div>
  </DemoWindow>;
}

export function SavingsGoalRender() {
  return <DemoWindow className="home-render-savings" label="Recreación ilustrativa de una meta de ahorro con progreso y celebraciones">
    <div className="home-render-savings-head"><span className="home-render-savings-icon"><FiTarget aria-hidden="true" /></span><div><span className="home-render-overline">META DE AHORRO · MXN</span><h3>Fondo para un viaje</h3><p>Tu meta, separada del gasto cotidiano.</p></div><span className="home-render-savings-menu" aria-hidden="true">•••</span></div>
    <div className="home-render-savings-body">
      <div className="home-savings-total"><div><small>AHORRADO</small><strong>$68,000</strong></div><div><small>META</small><strong>$100,000</strong></div></div>
      <div className="home-savings-progress-label"><span>Vas en buen camino</span><strong>68 %</strong></div>
      <div className="home-savings-track" role="progressbar" aria-label="Progreso ficticio de la meta de ahorro: 68%" aria-valuemin={0} aria-valuemax={100} aria-valuenow={68}><i /></div>
      <div className="home-savings-account"><span className="home-savings-account-icon">$</span><span><strong>Cuenta vinculada</strong><small>El saldo ayuda a seguir el avance de tu meta.</small></span><FiChevronRight aria-hidden="true" /></div>
      <div className="home-savings-milestones"><span>25 %</span><i /><span>50 %</span><i /><span className="is-next">75 %</span><i /><span>100 %</span></div>
      <div className="home-savings-celebration"><span aria-hidden="true">🎆</span><div><strong>¡Cada avance cuenta!</strong><small>Hitos y celebración cuando alcanzas tu objetivo.</small></div><FiTrendingUp aria-hidden="true" /></div>
    </div>
  </DemoWindow>;
}

export function WalletAnalyzerRender() {
  return <DemoWindow className="home-render-analyzer" label="Recreación ilustrativa del Wallet Analyzer con comparativas, tendencias, top categorías e insights">
    <div className="home-render-body">
      <div className="home-render-title-row"><div><span className="home-render-overline">MÁS QUE UN TOTAL</span><h3>Wallet Analyzer</h3></div><span className="home-render-top-action"><FiCalendar aria-hidden="true" /> Octubre 2026</span></div>
      <div className="home-analyzer-headline"><span>LO MÁS DESTACADO DEL MES</span><strong>Un límite rebasado · una categoría bajó · una suscripción nueva</strong><small>Insights calculados a partir de tu historial.</small></div>
      <div className="home-analyzer-kpis"><div><small>GASTOS</small><strong>$30,950</strong><span className="negative">↑ 17 % vs. mes anterior</span></div><div><small>INGRESOS</small><strong>$85,000</strong><span className="positive">↑ 8 % vs. mes anterior</span></div><div><small>TASA DE AHORRO</small><strong>36 %</strong><span>Comparación mensual</span></div></div>
      <div className="home-analyzer-grid">
        <div className="home-analyzer-panel home-analyzer-chart"><div className="home-analyzer-panel-heading"><strong>Tendencia · 6 meses</strong><span><i className="expense" /> Gastos <i className="income" /> Ingresos</span></div><div className="home-analyzer-bars" role="img" aria-label="Gráfica ficticia de ingresos y gastos durante seis meses">{[44, 58, 48, 70, 61, 82].map((value, index) => <div className="home-analyzer-bar-group" key={index}><span className="income" style={{ height: `${value + 12}%` }} /><span className="expense" style={{ height: `${value}%` }} /><small>{["MAY", "JUN", "JUL", "AGO", "SEP", "OCT"][index]}</small></div>)}</div></div>
        <div className="home-analyzer-panel home-analyzer-top"><div className="home-analyzer-panel-heading"><strong>Top categorías</strong><span>3 · 6 · 12 · 24</span></div>{[["1", "Casa", "$18,500"], ["2", "Despensa", "$6,840"], ["3", "Transporte", "$3,260"]].map(([rank, name, amount]) => <div className="home-analyzer-rank" key={rank}><span>{rank}</span><strong>{name}</strong><b>{amount}</b></div>)}</div>
      </div>
      <div className="home-analyzer-modules"><span><FiCheck aria-hidden="true" /> Presupuestos y rachas</span><span><FiCheck aria-hidden="true" /> Grandes gastos</span><span><FiCheck aria-hidden="true" /> Suscripciones</span><span><FiCheck aria-hidden="true" /> Divisas y ritmo de gasto</span></div>
    </div>
  </DemoWindow>;
}

export function HistoryRender() {
  return <DemoWindow className="home-render-history" label="Recreación ilustrativa del historial comparativo de Gastify">
    <div className="home-render-body"><div className="home-render-title-row"><div><span className="home-render-overline">TU HISTORIA, CON PERSPECTIVA</span><h3>Historial</h3></div><span className="home-render-top-action"><FiCalendar aria-hidden="true" /> Año 2026 ⌄</span></div>
      <div className="home-history-controls"><span>Mes</span><span>Trimestre</span><span className="is-active">Año</span><span>Rango</span><b>Comparar ✓</b></div>
      <div className="home-history-comparison"><div><small>2025 · ENE–OCT</small><strong>$248,600</strong><span>Gasto del periodo</span></div><span className="home-history-vs">VS.</span><div className="current"><small>2026 · ENE–OCT</small><strong>$231,480</strong><span>Gasto del periodo</span></div><div className="home-history-delta"><FiTrendingUp aria-hidden="true" /><strong>−7 %</strong><small>vs. mismo periodo</small></div></div>
      <div className="home-history-lower"><div className="home-history-chart-wrap"><div className="home-analyzer-panel-heading"><strong>Gastos por trimestre</strong><span>Ingresos y gastos</span></div><div className="home-history-chart" role="img" aria-label="Gráfica ficticia de gastos e ingresos por trimestre">{[["Q1", 62, 84], ["Q2", 48, 78], ["Q3", 72, 90], ["Q4", 55, 74]].map(([quarter, expense, income]) => <div className="home-history-quarter" key={quarter}><div><i className="expense" style={{ height: `${expense}%` }} /><i className="income" style={{ height: `${income}%` }} /></div><small>{quarter}</small></div>)}</div></div>
        <div className="home-history-tops"><div className="home-analyzer-panel-heading"><strong>Top categorías · hasta 6</strong><span>ver detalle ↗</span></div>{[["Casa", "$72,400"], ["Viajes", "$43,800"], ["Comida", "$31,250"]].map(([name, amount], index) => <div className="home-history-top-row" key={name}><span>{index + 1}</span><strong>{name}</strong><b>{amount}</b></div>)}<div className="home-history-footnote"><FiCheck aria-hidden="true" /> Compara categorías, presupuestos y movimientos.</div></div></div>
      <div className="home-render-history-legend"><span><i className="expense" /> Gastos</span><span><i className="income" /> Ingresos</span><span className="home-render-history-insight"><FiCheck aria-hidden="true" /> Mes, trimestre, año o rango personalizado</span></div>
    </div>
  </DemoWindow>;
}
