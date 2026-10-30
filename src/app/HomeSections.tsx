"use client";

import { useEffect, useRef, useState, type FocusEvent, type TouchEvent } from "react";
import Link from "next/link";
import { FiArrowLeft, FiArrowRight, FiCheck, FiChevronRight, FiFileText, FiGlobe, FiLayers, FiPause, FiPlay, FiPlus } from "react-icons/fi";
import { HistoryRender, MovementRender, ProjectRender, SavingsGoalRender, SpendingBudgetRender, WalletAnalyzerRender } from "./HomeProductRenders";
import type { Locale } from "@gastify/core/i18n/locales";

const categories = [
  { name: "Casa", amount: "$18,500", width: "82%", color: "#a88aff" },
  { name: "Despensa", amount: "$6,840", width: "61%", color: "#74d4c8" },
  { name: "Transporte", amount: "$3,260", width: "38%", color: "#ffc687" },
];

const heroSlides = [
  { title: <>Entiende tu dinero.<br /><em>Planea lo que sigue.</em></>, description: "Movimientos, cuentas, presupuestos y proyectos en un mismo lugar. Una vista clara de tus finanzas personales, incluso cuando tu dinero está en varias monedas.", visual: "panorama", label: "Tu panorama" },
  { title: <>Cada movimiento,<br /><em>en contexto.</em></>, description: "Del café de hoy al pago más importante del mes: tus movimientos se ordenan por cuenta, categoría y fecha para que encuentres lo que necesitas.", visual: "movements", label: "Movimientos" },
  { title: <>Una meta grande<br /><em>también tiene plan.</em></>, description: "Prepara un viaje o cualquier proyecto, vincula sus gastos reales y descubre cuánto te queda por delante.", visual: "project", label: "Proyectos" },
] as const;

const flowSlides = [
  { number: "01", eyebrow: "PRIMERO, REGISTRA", title: "Todo empieza por saber qué pasó.", description: "Anota un movimiento cuando ocurra o importa varios con la plantilla de Excel y archivos XML compatibles. Tus cuentas empiezan a contar una historia completa.", tip: "Registro manual o importación", kind: "import" },
  { number: "02", eyebrow: "DESPUÉS, ORGANIZA", title: "Cada movimiento en su lugar.", description: "Tus propias categorías, subcategorías y etiquetas hacen que una lista de cargos se convierta en algo que reconoces y puedes consultar.", tip: "Categorías hechas para ti", kind: "organize" },
  { number: "03", eyebrow: "POR ÚLTIMO, ENTIENDE", title: "Mira el patrón, no sólo el saldo.", description: "Compara periodos, explora tu historial y sigue el rastro de cada cambio hasta los movimientos que lo explican.", tip: "Análisis con contexto", kind: "analyze" },
] as const;

const featureSlides = [
  { index: "3.1", eyebrow: "MOVIMIENTOS", title: "Cada movimiento, en su lugar.", description: "Registra gastos e ingresos, importa movimientos y luego búscalos, fíltralos o edítalos desde un mismo lugar.", points: ["Registro manual e importación", "Filtros por cuenta, categoría y periodo", "Detalle para entender cada cargo"], kind: "movements" },
  { index: "3.2", eyebrow: "PRESUPUESTOS", title: "El límite siempre a la vista.", description: "Asigna un tope a tus categorías, revisa el avance y descubre qué gastos todavía no has contemplado. Las barras, porcentajes y expresiones hacen visible cómo va el mes.", points: ["Avisos dentro de Gastify al 70, 80, 90 y 100 %", "Fuego, alertas y celebraciones según tu avance", "Una lista aparte para gastos sin presupuesto"], kind: "budgets" },
  { index: "3.3", eyebrow: "AHORRO", title: "Ahorra con una meta, no a ciegas.", description: "El ahorro vive aparte de tus presupuestos de gasto: define cuánto quieres reunir, vincula cuentas y mira cómo avanzas. Gastify celebra los hitos de tu objetivo.", points: ["Seguimiento independiente de tus gastos", "Avisos de avance al 25, 50, 75 y 100 %", "Confeti al alcanzar una meta"], kind: "savings" },
  { index: "3.4", eyebrow: "PROYECTOS", title: "Un proyecto, su propio presupuesto.", description: "Planea un gasto de una sola vez con fechas editables y asocia los movimientos reales a ese proyecto; no tienes que forzarlo a un ciclo mensual.", points: ["Presupuesto único con inicio y fin", "Fechas y detalles editables", "Movimientos vinculados en un mismo lugar"], kind: "project" },
  { index: "3.5", eyebrow: "WALLET ANALYZER", title: "Un análisis de verdad, hasta el detalle.", description: "Compara con el mes anterior y baja desde el panorama hasta las categorías y movimientos que explican el cambio.", points: ["Tendencias, promedios, ritmo y patrones por día", "Top 3, 6, 12 o 24 categorías y movimientos", "Presupuestos, rachas, anomalías y gastos grandes", "Suscripciones y exposición a otras monedas"], kind: "analyzer" },
  { index: "3.6", eyebrow: "HISTORIAL", title: "Tu dinero también cuenta una historia.", description: "Explora meses, trimestres, semestres, años completos o un rango propio. Compáralos y encuentra qué cambió con detalle.", points: ["Elige y compara periodos equivalentes o personalizados", "Top de categorías y movimientos, hasta 24", "Cambios de categorías y presupuestos con detalle", "Proyecciones y momentos destacados del periodo"], kind: "history" },
  { index: "3.7", eyebrow: "MULTIMONEDA", title: "Varias monedas. Un panorama claro.", description: "Cada cuenta conserva su moneda original. Tu moneda principal traduce saldos y reportes para que puedas compararlos sin perder el dato nativo.", points: ["MXN, USD, EUR y JPY", "Moneda principal elegida por ti", "Exposición de divisas en Wallet Analyzer"], kind: "currency" },
] as const;

const aiSlides = [
  { kind: "month", eyebrow: "COMPARA MESES", question: "¿En qué gasté más en octubre y cómo se compara con septiembre?", takeaway: "Un resumen con cifras, categorías y el cambio frente al mes anterior." },
  { kind: "register", eyebrow: "REGISTRA UN GASTO", question: "Registra $184 de Uber en Transporte, desde BBVA Nómina.", takeaway: "Del mensaje al movimiento, con los datos que tú indicaste." },
  { kind: "period", eyebrow: "EXPLORA TENDENCIAS", question: "¿Cómo cambiaron mis gastos en los últimos tres meses?", takeaway: "Una lectura del periodo, no sólo un número suelto." },
  { kind: "statement", eyebrow: "PREPARA UNA IMPORTACIÓN", question: "Adjunté mi estado de cuenta. ¿Qué cargos podríamos registrar?", takeaway: "Si tu asistente admite archivos, revisa los cargos antes de registrarlos." },
] as const;

const heroSlidesEn = [
  { title: <>Understand your money.<br /><em>Plan what comes next.</em></>, description: "Transactions, accounts, budgets and projects in one place. A clear view of your personal finances, even when your money is in different currencies.", visual: "panorama", label: "Your overview" },
  { title: <>Every transaction,<br /><em>in context.</em></>, description: "From today's coffee to the month's biggest bill: your transactions are organized by account, category and date, so you can find what you need.", visual: "movements", label: "Transactions" },
  { title: <>Big goals<br /><em>need a plan.</em></>, description: "Plan a trip or another project, link its real expenses and see how much you still have ahead.", visual: "project", label: "Projects" },
] as const;

const flowSlidesEn = [
  { number: "01", eyebrow: "FIRST, RECORD", title: "It starts with knowing what happened.", description: "Record a transaction as it happens or import several with our Excel template and compatible XML files. Your accounts begin to tell the whole story.", tip: "Manual entry or import", kind: "import" },
  { number: "02", eyebrow: "THEN, ORGANIZE", title: "Every transaction in its place.", description: "Your own categories, subcategories and tags turn a list of charges into something recognizable and easy to revisit.", tip: "Categories made for you", kind: "organize" },
  { number: "03", eyebrow: "FINALLY, UNDERSTAND", title: "See the pattern, not just the balance.", description: "Compare periods, explore your history and trace every change back to the transactions behind it.", tip: "Analysis with context", kind: "analyze" },
] as const;

const featureSlidesEn = [
  { index: "3.1", eyebrow: "TRANSACTIONS", title: "Every transaction, in its place.", description: "Record expenses and income, import transactions, then find, filter or edit them in one place.", points: ["Manual entry and imports", "Filter by account, category and period", "Details that explain every charge"], kind: "movements" },
  { index: "3.2", eyebrow: "BUDGETS", title: "Keep your limits in sight.", description: "Set a limit for your categories, track progress and spot expenses you have not planned for. Progress bars and cues make the month easy to read.", points: ["In-app alerts at 70, 80, 90 and 100%", "Celebrations and warnings as you progress", "A separate list for unbudgeted spending"], kind: "budgets" },
  { index: "3.3", eyebrow: "SAVINGS", title: "Save toward a goal, not blindly.", description: "Savings are separate from spending budgets: set a target, link accounts and track your progress. Gastify celebrates your milestones.", points: ["Track savings separately from spending", "Progress reminders at 25, 50, 75 and 100%", "Confetti when you reach your goal"], kind: "savings" },
  { index: "3.4", eyebrow: "PROJECTS", title: "One project, its own budget.", description: "Plan a one-time expense with editable dates and link real transactions to the project—no need to force it into a monthly cycle.", points: ["One-time budget with start and end dates", "Editable dates and details", "Linked transactions in one place"], kind: "project" },
  { index: "3.5", eyebrow: "WALLET ANALYZER", title: "A thorough analysis, down to the details.", description: "Compare with last month and drill from the big picture into the categories and transactions that explain the change.", points: ["Trends, averages, pace and weekday patterns", "Top 3, 6, 12 or 24 categories and transactions", "Budgets, streaks, anomalies and large expenses", "Subscriptions and multi-currency exposure"], kind: "analyzer" },
  { index: "3.6", eyebrow: "HISTORY", title: "Your money tells a story, too.", description: "Explore months, quarters, half-years, full years or a custom range. Compare them and see what changed in detail.", points: ["Choose equivalent or custom periods to compare", "Top categories and transactions, up to 24", "Detailed category and budget changes", "Forecasts and highlights for the period"], kind: "history" },
  { index: "3.7", eyebrow: "MULTI-CURRENCY", title: "Different currencies. One clear view.", description: "Each account keeps its original currency. Your primary currency converts balances and reports so you can compare them without losing the native amount.", points: ["MXN, USD, EUR and JPY", "Choose your primary currency", "Currency exposure in Wallet Analyzer"], kind: "currency" },
] as const;

const aiSlidesEn = [
  { kind: "month", eyebrow: "COMPARE MONTHS", question: "Where did I spend the most in October, and how does it compare with September?", takeaway: "A summary with amounts, categories and the change from last month." },
  { kind: "register", eyebrow: "RECORD AN EXPENSE", question: "Record a $184 Uber ride in Transport, from BBVA Payroll.", takeaway: "From your message to a transaction, using the details you provided." },
  { kind: "period", eyebrow: "EXPLORE TRENDS", question: "How did my spending change over the last three months?", takeaway: "A read of the full period, not just a number on its own." },
  { kind: "statement", eyebrow: "PREPARE AN IMPORT", question: "I attached my statement. Which charges could we record?", takeaway: "If your assistant supports files, review the charges before importing them." },
] as const;

type AiSlide = { kind: typeof aiSlides[number]["kind"]; eyebrow: string; question: string; takeaway: string };

function useCarouselEnvironment() {
  const [documentVisible, setDocumentVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setMotionAllowed(!preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const syncVisibility = () => setDocumentVisible(document.visibilityState === "visible");
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  return { documentVisible, motionAllowed };
}

function useCarousel(length: number, { documentVisible, motionAllowed }: ReturnType<typeof useCarouselEnvironment>, sectionId: string) {
  const [index, setIndex] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const isPlaying = !manuallyPaused && !focused && sectionVisible && documentVisible && motionAllowed;

  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section || typeof IntersectionObserver === "undefined") return;

    // Only run the carousel whose chapter is crossing the center of the screen.
    // This avoids several distant sections advancing in the background at once.
    let observer: IntersectionObserver | undefined;
    const observeCenterBand = () => {
      observer?.disconnect();
      // Use pixels instead of percentage root margins: vertical percentages
      // are resolved against the viewport width by IntersectionObserver.
      const inset = Math.round(window.innerHeight * 0.35);
      observer = new IntersectionObserver(
        ([entry]) => setSectionVisible(entry.isIntersecting),
        { rootMargin: `-${inset}px 0px -${inset}px 0px`, threshold: 0.05 },
      );
      observer.observe(section);
    };
    observeCenterBand();
    window.addEventListener("resize", observeCenterBand);
    return () => {
      window.removeEventListener("resize", observeCenterBand);
      observer?.disconnect();
    };
  }, [sectionId]);

  useEffect(() => {
    if (!isPlaying || length < 2) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % length), 8000);
    return () => window.clearTimeout(timer);
  }, [index, isPlaying, length]);

  const previous = () => setIndex((current) => (current - 1 + length) % length);
  const next = () => setIndex((current) => (current + 1) % length);
  const toggleAutoplay = () => {
    if (isPlaying) {
      setManuallyPaused(true);
      return;
    }
    setManuallyPaused(false);
    setFocused(false);
  };
  const onFocusCapture = (event: FocusEvent<HTMLElement>) => {
    // A mouse click focuses buttons too; only keyboard-visible focus should
    // pause the timer, otherwise clicking “play” can immediately pause it again.
    if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) setFocused(true);
  };
  const onBlurCapture = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  return {
    index, setIndex, previous, next, isPlaying, motionAllowed, toggleAutoplay,
    onFocusCapture,
    onBlurCapture,
  };
}

function useSwipe(previous: () => void, next: () => void) {
  const start = useRef({ x: 0, y: 0 });
  return {
    onTouchStart: (event: TouchEvent<HTMLElement>) => { start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      const dx = event.changedTouches[0].clientX - start.current.x;
      const dy = event.changedTouches[0].clientY - start.current.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? next : previous)();
    },
  };
}

function CarouselControls({ label, index, count, previous, next, setIndex, isPlaying, motionAllowed, toggleAutoplay, locale }: { label: string; index: number; count: number; previous: () => void; next: () => void; setIndex: (index: number) => void; isPlaying: boolean; motionAllowed: boolean; toggleAutoplay: () => void; locale: Locale }) {
  const en = locale === "en";
  return <div className="home-carousel-controls" role="group" aria-label={`${en ? "Controls for" : "Controles de"} ${label}`}>
    <span className="home-carousel-count">{String(index + 1).padStart(2, "0")} <span>/ {String(count).padStart(2, "0")}</span></span>
    <div className="home-carousel-dots" role="group" aria-label={`${en ? "Slides for" : "Diapositivas de"} ${label}`}>{Array.from({ length: count }, (_, dot) => <button type="button" key={dot} aria-label={`${en ? "Show slide" : "Mostrar diapositiva"} ${dot + 1} ${en ? "of" : "de"} ${label}`} aria-current={index === dot ? "true" : undefined} className={index === dot ? "is-active" : ""} onClick={() => setIndex(dot)} />)}</div>
    <button className="home-carousel-toggle" type="button" aria-label={!motionAllowed ? `${en ? "Automatic advance" : "Avance automático"} ${label} ${en ? "disabled by reduced-motion preference" : "desactivado por movimiento reducido"}` : `${isPlaying ? (en ? "Pause" : "Pausar") : (en ? "Resume" : "Reanudar")} ${en ? "carousel" : "carrusel"} ${label}`} title={!motionAllowed ? (en ? "Disabled by your reduced-motion preference" : "Desactivado por tu preferencia de movimiento reducido") : undefined} onClick={toggleAutoplay} disabled={!motionAllowed}>{isPlaying ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}</button>
    <div className="home-carousel-arrows"><button type="button" aria-label={`${en ? "Previous" : "Anterior"} ${en ? "in" : "en"} ${label}`} onClick={previous}><FiArrowLeft aria-hidden="true" /></button><button type="button" aria-label={`${en ? "Next" : "Siguiente"} ${en ? "in" : "en"} ${label}`} onClick={next}><FiArrowRight aria-hidden="true" /></button></div>
  </div>;
}

function HeroPreview({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const visibleCategories = en ? [
    { name: "Home", amount: "$18,500", width: "82%", color: "#a88aff" },
    { name: "Groceries", amount: "$6,840", width: "61%", color: "#74d4c8" },
    { name: "Transport", amount: "$3,260", width: "38%", color: "#ffc687" },
  ] : categories;
  return <div className="home-hero-visual" aria-label="Vista ilustrativa de un resumen de finanzas en Gastify">
    <div className="home-preview-window"><div className="home-preview-topbar"><span className="home-preview-brand"><span className="home-preview-brand-mark">G</span> Gastify</span><span className="home-preview-period">{en ? "October 2026" : "Octubre 2026"} ⌄</span></div>
      <div className="home-preview-content"><div className="home-preview-eyebrow">{en ? "YOUR OVERVIEW" : "TU PANORAMA"}</div><div className="home-preview-balance">$72,420<span>.00</span> <small>MXN</small></div><p>{en ? "A view of what comes in, goes out and stays with you." : "Una vista de lo que entra, sale y se queda contigo."}</p>
        <div className="home-preview-stats"><div><span>{en ? "Income" : "Ingresos"}</span><strong>+$83,600</strong></div><div><span>{en ? "Spending" : "Gastos"}</span><strong>−$32,180</strong></div><div><span>{en ? "Monthly balance" : "Balance del mes"}</span><strong>+$51,420</strong></div></div>
        <div className="home-preview-lower"><div className="home-preview-chart"><div className="home-preview-panel-heading"><strong>{en ? "Where it went" : "En qué se fue"}</strong><span>{en ? "View analysis" : "Ver análisis"} ↗</span></div>{visibleCategories.map((category) => <div className="home-preview-category" key={category.name}><div><span>{category.name}</span><b>{category.amount}</b></div><div className="home-preview-track"><span style={{ width: category.width, background: category.color }} /></div></div>)}</div><div className="home-preview-accounts"><div className="home-preview-panel-heading"><strong>{en ? "Your accounts" : "Tus cuentas"}</strong><span>{en ? "3 accounts" : "3 cuentas"}</span></div><div><span className="home-preview-dot" /> BBVA <b>$38,920</b></div><div><span className="home-preview-dot mint" /> Revolut USD <b>$1,180</b></div><div><span className="home-preview-dot coral" /> Santander <b>$12,160</b></div></div></div>
      </div>
    </div><div className="home-preview-note">{en ? "Visual example · fictional data" : "Ejemplo visual · datos ficticios"}</div>
  </div>;
}

function FlowVisual({ kind, locale }: { kind: typeof flowSlides[number]["kind"]; locale: Locale }) {
  const en = locale === "en";
  if (kind === "analyze") return <HistoryRender locale={locale} />;
  if (kind === "organize") return <div className="home-flow-visual home-flow-organize" aria-label={en ? "Illustration of transactions grouped by category" : "Ejemplo ilustrativo de movimientos agrupados por categoría"}><div className="home-visual-topline"><FiLayers aria-hidden="true" /> {en ? "Your transactions, your way" : "Tus movimientos, a tu manera"} <span>{en ? "OCTOBER" : "OCTUBRE"}</span></div><div className="home-organize-row"><span className="home-organize-icon home-organize-purple">⌂</span><div><strong>{en ? "Home" : "Casa"}</strong><small>{en ? "Rent · utilities · maintenance" : "Renta · servicios · mantenimiento"}</small></div><b>$18,500</b></div><div className="home-organize-row"><span className="home-organize-icon home-organize-green">◈</span><div><strong>{en ? "Groceries" : "Despensa"}</strong><small>{en ? "Supermarket · household" : "Supermercado · compras del hogar"}</small></div><b>$6,840</b></div><div className="home-organize-row"><span className="home-organize-icon home-organize-orange">↗</span><div><strong>{en ? "Transport" : "Transporte"}</strong><small>{en ? "Rides · fuel" : "Traslados · combustible"}</small></div><b>$3,260</b></div><div className="home-organize-footer"><span>{en ? "Tags" : "Etiquetas"}</span><span># sample-trip</span><span># monthly</span><span><FiPlus aria-hidden="true" /> {en ? "New" : "Nueva"}</span></div><small className="home-visual-disclaimer">{en ? "Visual example · fictional data" : "Ejemplo visual · datos ficticios"}</small></div>;
  return <div className="home-flow-visual home-flow-import" aria-label={en ? "Illustration of recording and importing transactions" : "Ejemplo ilustrativo de registro e importación de movimientos"}><div className="home-visual-topline"><FiFileText aria-hidden="true" /> {en ? "Transactions" : "Movimientos"} <span>+ {en ? "Add" : "Agregar"}</span></div><div className="home-import-row"><span className="home-import-icon">↓</span><div><strong>{en ? "Import your file" : "Importa tu archivo"}</strong><small>{en ? "Compatible Excel or XML" : "Excel o XML compatible"}</small></div><FiChevronRight aria-hidden="true" /></div><div className="home-import-divider"><span>{en ? "or record one in seconds" : "o registra uno en segundos"}</span></div><div className="home-import-fields"><div><span>{en ? "Description" : "Concepto"}</span><strong>{en ? "Morning coffee" : "Café de la mañana"}</strong></div><div><span>{en ? "Amount" : "Monto"}</span><strong>$85.00 MXN</strong></div></div><div className="home-import-save"><FiCheck aria-hidden="true" /> {en ? "Transaction recorded" : "Movimiento registrado"}</div><small className="home-visual-disclaimer">{en ? "Visual example · fictional data" : "Ejemplo visual · datos ficticios"}</small></div>;
}

function FeatureVisual({ kind, locale }: { kind: typeof featureSlides[number]["kind"]; locale: Locale }) {
  if (kind === "movements") return <MovementRender locale={locale} />;
  if (kind === "project") return <ProjectRender locale={locale} />;
  if (kind === "history") return <HistoryRender locale={locale} />;
  if (kind === "budgets") return <SpendingBudgetRender locale={locale} />;
  if (kind === "savings") return <SavingsGoalRender locale={locale} />;
  if (kind === "analyzer") return <WalletAnalyzerRender locale={locale} />;
  const en = locale === "en";
  return <div className="home-currency-visual" aria-label={en ? "Illustration of accounts in different currencies" : "Ilustración de cuentas en distintas monedas"}><div className="home-currency-header"><FiGlobe aria-hidden="true" /><span>{en ? "YOUR ACCOUNTS" : "TUS CUENTAS"}</span><span className="home-currency-primary">{en ? "Primary view: MXN" : "Vista principal: MXN"} ⌄</span></div><div className="home-currency-account"><span className="home-currency-badge">$</span><div><strong>Revolut</strong><small>{en ? "US dollars" : "Dólares estadounidenses"}</small></div><b>1,180.00 <small>USD</small></b></div><div className="home-currency-account"><span className="home-currency-badge euro">€</span><div><strong>{en ? "EUR account" : "Cuenta EUR"}</strong><small>{en ? "Euros" : "Euros"}</small></div><b>840.00 <small>EUR</small></b></div><div className="home-currency-account"><span className="home-currency-badge yen">¥</span><div><strong>{en ? "JPY account" : "Cuenta JPY"}</strong><small>{en ? "Japanese yen" : "Yenes japoneses"}</small></div><b>24,000 <small>JPY</small></b></div><div className="home-currency-bottom">{en ? "Each balance keeps its original currency. Reports use your primary currency." : "Cada saldo conserva su moneda original. Tus reportes siguen la moneda principal."}</div><small className="home-visual-disclaimer">{en ? "Visual example · fictional data" : "Ejemplo visual · datos ficticios"}</small></div>;
}

function AiAnswer({ kind, locale }: { kind: typeof aiSlides[number]["kind"]; locale: Locale }) {
  const en = locale === "en";
  if (en && kind === "month") return <><p>In October, you spent <strong>$30,950</strong>, <strong>$4,560 more</strong> than in September (+17%). Home was your largest category.</p><div className="home-ai-result-stats"><div><small>OCTOBER</small><strong>$30,950</strong></div><div><small>SEPTEMBER</small><strong>$26,390</strong></div><div><small>CHANGE</small><strong className="coral">+17%</strong></div></div><div className="home-ai-mini-table"><div><span>Category</span><span>October</span><span>Share</span></div><div><strong>Home</strong><b>$18,500</b><span>60%</span></div><div><strong>Restaurants</strong><b>$4,100</b><span>13%</span></div><div><strong>Transport</strong><b>$3,260</b><span>11%</span></div></div><div className="home-ai-insight">Home accounts for most of the total; we can open its transactions to see what changed.</div></>;
  if (en && kind === "register") return <><p>Done. I recorded the transaction with the details you gave me:</p><div className="home-ai-receipt"><span className="home-ai-receipt-icon">↗</span><div><strong>Uber</strong><small>Transport · BBVA Payroll</small></div><b>−$184.00 <small>MXN</small></b></div><div className="home-ai-insight success"><FiCheck aria-hidden="true" /> Transaction added to Gastify.</div><p className="home-ai-next">You can also ask me to record several transactions in one message.</p></>;
  if (en && kind === "period") return <><p>Your spending went from <strong>$24,650 in August</strong> to <strong>$30,950 in October</strong>: up about <strong>26%</strong> over the period.</p><div className="home-ai-period-bars"><div><span>AUG</span><i><b style={{ width: "72%" }} /></i><strong>$24,650</strong></div><div><span>SEP</span><i><b style={{ width: "82%" }} /></i><strong>$26,390</strong></div><div><span>OCT</span><i><b style={{ width: "96%" }} /></i><strong>$30,950</strong></div></div><div className="home-ai-insight">The largest increase came in October. I can break it down by category or compare full periods.</div></>;
  if (en && kind === "statement") return <><p>I found these three sample charges in the file. Before recording them, let&apos;s review their category, account and possible duplicates:</p><div className="home-ai-mini-table home-ai-statement-table"><div><span>Transaction</span><span>Date</span><span>Amount</span></div><div><strong>La Comer</strong><span>Oct 21</span><b>$1,480</b></div><div><strong>Uber</strong><span>Oct 20</span><b>$184</b></div><div><strong>Farmacia San Pablo</strong><span>Oct 18</span><b>$425</b></div></div><div className="home-ai-insight">Confirm the charges and your assistant can record them together. File reading depends on the assistant and supported format.</div></>;
  if (kind === "month") return <><p>En octubre gastaste <strong>$30,950</strong>, <strong>$4,560 más</strong> que en septiembre (+17 %). La categoría principal fue Casa.</p><div className="home-ai-result-stats"><div><small>OCTUBRE</small><strong>$30,950</strong></div><div><small>SEPTIEMBRE</small><strong>$26,390</strong></div><div><small>CAMBIO</small><strong className="coral">+17 %</strong></div></div><div className="home-ai-mini-table"><div><span>Categoría</span><span>Octubre</span><span>Del total</span></div><div><strong>Casa</strong><b>$18,500</b><span>60 %</span></div><div><strong>Restaurantes</strong><b>$4,100</b><span>13 %</span></div><div><strong>Transporte</strong><b>$3,260</b><span>11 %</span></div></div><div className="home-ai-insight">El gasto en Casa explica la mayor parte del total; podemos abrir sus movimientos para ver qué cambió.</div></>;
  if (kind === "register") return <><p>Listo. Registré el movimiento con los detalles que me diste:</p><div className="home-ai-receipt"><span className="home-ai-receipt-icon">↗</span><div><strong>Uber</strong><small>Transporte · BBVA Nómina</small></div><b>−$184.00 <small>MXN</small></b></div><div className="home-ai-insight success"><FiCheck aria-hidden="true" /> Movimiento agregado a Gastify.</div><p className="home-ai-next">También puedes pedir varios movimientos en un solo mensaje.</p></>;
  if (kind === "period") return <><p>Tus gastos pasaron de <strong>$24,650 en agosto</strong> a <strong>$30,950 en octubre</strong>: subieron cerca de <strong>26 %</strong> en el periodo.</p><div className="home-ai-period-bars"><div><span>AGO</span><i><b style={{ width: "72%" }} /></i><strong>$24,650</strong></div><div><span>SEP</span><i><b style={{ width: "82%" }} /></i><strong>$26,390</strong></div><div><span>OCT</span><i><b style={{ width: "96%" }} /></i><strong>$30,950</strong></div></div><div className="home-ai-insight">El aumento más marcado llegó en octubre. Puedo desglosarlo por categoría o comparar periodos completos.</div></>;
  return <><p>Encontré estos tres cargos de ejemplo en el archivo. Antes de registrarlos, revisemos categoría, cuenta y posibles duplicados:</p><div className="home-ai-mini-table home-ai-statement-table"><div><span>Movimiento</span><span>Fecha</span><span>Monto</span></div><div><strong>Súper La Comer</strong><span>21 oct</span><b>$1,480</b></div><div><strong>Uber</strong><span>20 oct</span><b>$184</b></div><div><strong>Farmacia San Pablo</strong><span>18 oct</span><b>$425</b></div></div><div className="home-ai-insight">Puedes confirmar los cargos y el asistente los registrará en lote. La lectura del archivo depende del asistente y del formato admitido.</div></>;
}

function AiConversation({ slide, locale }: { slide: AiSlide; locale: Locale }) {
  const en = locale === "en";
  return <div className="home-ai-example" aria-label={`${en ? "Illustrative AI example" : "Ejemplo ilustrativo de IA"}: ${slide.eyebrow.toLowerCase()}`}><div className="home-ai-example-top"><span className="home-ai-pulse" /> {en ? "Conversation example" : "Ejemplo de conversación"} · {slide.eyebrow.toLowerCase()}</div><div className="home-ai-question">“{slide.question}”</div><div className="home-ai-answer"><div className="home-ai-answer-logo">G</div><div className="home-ai-answer-body"><AiAnswer kind={slide.kind} locale={locale} /></div></div><div className="home-ai-example-bottom">{en ? "Illustrative example · fictional amounts and transactions" : "Ejemplo ilustrativo · cifras y movimientos ficticios"}</div></div>;
}

export default function HomeSections({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const activeHeroSlides = en ? heroSlidesEn : heroSlides;
  const activeFlowSlides = en ? flowSlidesEn : flowSlides;
  const activeFeatureSlides = en ? featureSlidesEn : featureSlides;
  const activeAiSlides = en ? aiSlidesEn : aiSlides;
  const carouselEnvironment = useCarouselEnvironment();
  const hero = useCarousel(activeHeroSlides.length, carouselEnvironment, "portada");
  const flow = useCarousel(activeFlowSlides.length, carouselEnvironment, "como-funciona");
  const feature = useCarousel(activeFeatureSlides.length, carouselEnvironment, "herramientas");
  const ai = useCarousel(activeAiSlides.length, carouselEnvironment, "inteligencia");
  const heroSlide = activeHeroSlides[hero.index];
  const flowSlide = activeFlowSlides[flow.index];
  const featureSlide = activeFeatureSlides[feature.index];
  const aiSlide = activeAiSlides[ai.index];
  const heroSwipe = useSwipe(hero.previous, hero.next);
  const flowSwipe = useSwipe(flow.previous, flow.next);
  const featureSwipe = useSwipe(feature.previous, feature.next);
  const aiSwipe = useSwipe(ai.previous, ai.next);

  return <>
    <section id="portada" className="home-hero home-shell home-chapter" aria-labelledby="home-hero-title" aria-roledescription="carrusel" {...heroSwipe} onFocusCapture={hero.onFocusCapture} onBlurCapture={hero.onBlurCapture}>
      <div className="home-hero-copy"><div className="home-hero-changing" aria-live={hero.isPlaying ? "off" : "polite"} aria-atomic="true" key={hero.index}><h1 id="home-hero-title">{heroSlide.title}</h1><p>{heroSlide.description}</p></div>
        <div className="home-hero-actions"><Link href="/register" className="home-button">{en ? "Get started with Gastify" : "Empieza con Gastify"} <FiArrowRight aria-hidden="true" /></Link><Link href="/demo" prefetch={false} aria-label={en ? "Explore Gastify with sample data, no sign-up needed" : "Explora Gastify con datos ficticios, sin registrarte"} className="home-demo-link">{en ? "Try Gastify with sample data" : "Explora Gastify con datos ficticios"} <FiArrowRight aria-hidden="true" /></Link><a href="#como-funciona" className="home-text-link">{en ? "See how it works" : "Explora cómo funciona"} <span aria-hidden="true">↓</span></a></div>
        <div className="home-hero-assurance"><span className="home-pill"><span /> {en ? "Discover your spending habits in a minute" : "Descubre tus hábitos de gasto en un minuto"}</span><div className="home-hero-proof"><span><FiCheck aria-hidden="true" /> {en ? "Categories made for you" : "Categorías a tu medida"}</span><span><FiCheck aria-hidden="true" /> {en ? "Import or enter transactions manually" : "Importación y registro manual"}</span></div></div>
        <CarouselControls locale={locale} label={en ? "cover" : "portada"} index={hero.index} count={activeHeroSlides.length} previous={hero.previous} next={hero.next} setIndex={hero.setIndex} isPlaying={hero.isPlaying} motionAllowed={hero.motionAllowed} toggleAutoplay={hero.toggleAutoplay} />
      </div>
      <div className="home-hero-media" key={heroSlide.visual}>{heroSlide.visual === "panorama" ? <HeroPreview locale={locale} /> : heroSlide.visual === "movements" ? <MovementRender locale={locale} /> : <ProjectRender locale={locale} />}</div>
    </section>

    <section className="home-story home-chapter" id="como-funciona" aria-labelledby="home-flow-title" onFocusCapture={flow.onFocusCapture} onBlurCapture={flow.onBlurCapture}><div className="home-shell home-story-inner"><div className="home-chapter-heading"><span className="home-eyebrow">02 / {en ? "HOW IT WORKS" : "CÓMO FUNCIONA"}</span><span className="home-chapter-hint">{en ? "One idea at a time. Swipe to explore." : "Una idea a la vez. Desliza para explorar."}</span></div>
      <div className="home-story-card" aria-roledescription="carousel" aria-label={en ? "How Gastify works" : "Cómo funciona Gastify"} {...flowSwipe}><div className="home-story-copy" key={flow.index}><span className="home-story-number">{flowSlide.number}<i /></span><span className="home-feature-index">{flowSlide.eyebrow}</span><h2 id="home-flow-title">{flowSlide.title}</h2><p>{flowSlide.description}</p><span className="home-story-tip"><FiCheck aria-hidden="true" /> {flowSlide.tip}</span></div><div className="home-story-media" key={flowSlide.kind}><FlowVisual kind={flowSlide.kind} locale={locale} /></div></div>
      <CarouselControls locale={locale} label={en ? "how it works" : "cómo funciona"} index={flow.index} count={activeFlowSlides.length} previous={flow.previous} next={flow.next} setIndex={flow.setIndex} isPlaying={flow.isPlaying} motionAllowed={flow.motionAllowed} toggleAutoplay={flow.toggleAutoplay} />
    </div></section>

    <section className="home-showcase home-chapter" id="herramientas" aria-label={en ? "Gastify tools" : "Herramientas de Gastify"} onFocusCapture={feature.onFocusCapture} onBlurCapture={feature.onBlurCapture}><div className="home-shell"><div className="home-chapter-heading"><span className="home-eyebrow">03 / {en ? "TOOLS" : "HERRAMIENTAS"}</span><span className="home-chapter-hint">{en ? "Everyday money and big plans, in one view." : "Lo cotidiano y lo extraordinario, en la misma vista."}</span></div>
      <div className="home-showcase-stage" aria-roledescription="carousel" aria-label={en ? "Gastify tools" : "Herramientas de Gastify"} {...featureSwipe}><div className="home-feature-copy" key={feature.index}><span className="home-feature-index">{featureSlide.index} / {featureSlide.eyebrow}</span><h3>{featureSlide.title}</h3><p>{featureSlide.description}</p><ul>{featureSlide.points.map((point) => <li key={point}><FiCheck aria-hidden="true" /> {point}</li>)}</ul></div><div className="home-showcase-media" key={featureSlide.kind}><FeatureVisual kind={featureSlide.kind} locale={locale} /></div></div>
      <CarouselControls locale={locale} label={en ? "tools" : "herramientas"} index={feature.index} count={activeFeatureSlides.length} previous={feature.previous} next={feature.next} setIndex={feature.setIndex} isPlaying={feature.isPlaying} motionAllowed={feature.motionAllowed} toggleAutoplay={feature.toggleAutoplay} />
      <div className="home-tool-index" aria-label={en ? "Go to a tool" : "Ir a una herramienta"}>{activeFeatureSlides.map((slide, index) => <button type="button" key={slide.kind} aria-current={index === feature.index ? "true" : undefined} onClick={() => feature.setIndex(index)}><span>{slide.index}</span>{slide.eyebrow}</button>)}</div>
    </div></section>

    <section className="home-ai home-chapter" id="inteligencia" aria-labelledby="home-ai-title" {...aiSwipe} onFocusCapture={ai.onFocusCapture} onBlurCapture={ai.onBlurCapture}><div className="home-shell home-ai-inner"><div className="home-ai-copy"><span className="home-eyebrow">04 / {en ? "YOUR DATA, YOUR QUESTIONS" : "TU INFORMACIÓN, TUS PREGUNTAS"}</span><h2 id="home-ai-title">{en ? "Bring your finances to your own AI." : "Lleva tus finanzas a tu propia IA."}</h2><p>{en ? "Connect Gastify to a compatible assistant to ask about your data, compare periods or record transactions. You create and control the access key from your profile." : "Conecta Gastify a un asistente compatible para consultar tus datos, comparar periodos o registrar movimientos. Tú generas y controlas la clave de acceso desde tu perfil."}</p><p className="home-ai-footnote">{en ? "Optional connection. Examples use fictional data; available features depend on the assistant." : "Conexión opcional. Los ejemplos usan datos ficticios; las funciones disponibles pueden variar según el asistente."}</p><Link href="/register" className="home-text-link">{en ? "Create your account" : "Crea tu cuenta"} <FiArrowRight aria-hidden="true" /></Link><div className="home-ai-takeaway" key={ai.index}><span>{aiSlide.eyebrow}</span><strong>{aiSlide.takeaway}</strong></div></div><div className="home-ai-stage" key={aiSlide.kind}><AiConversation slide={aiSlide} locale={locale} /></div><CarouselControls locale={locale} label={en ? "AI examples" : "ejemplos de IA"} index={ai.index} count={activeAiSlides.length} previous={ai.previous} next={ai.next} setIndex={ai.setIndex} isPlaying={ai.isPlaying} motionAllowed={ai.motionAllowed} toggleAutoplay={ai.toggleAutoplay} /></div></section>
  </>;
}
