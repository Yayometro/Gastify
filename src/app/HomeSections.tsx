"use client";

import { useEffect, useRef, useState, type FocusEvent, type TouchEvent } from "react";
import Link from "next/link";
import { FiArrowLeft, FiArrowRight, FiCheck, FiChevronRight, FiFileText, FiGlobe, FiLayers, FiPause, FiPlay, FiPlus } from "react-icons/fi";
import { HistoryRender, MovementRender, ProjectRender, SavingsGoalRender, SpendingBudgetRender, WalletAnalyzerRender } from "./HomeProductRenders";

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

function useCarousel(length: number, { documentVisible, motionAllowed }: ReturnType<typeof useCarouselEnvironment>) {
  const [index, setIndex] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPlaying = !manuallyPaused && !hovered && !focused && documentVisible && motionAllowed;

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
    setHovered(false);
    setFocused(false);
  };
  const onBlurCapture = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  return {
    index, setIndex, previous, next, isPlaying, motionAllowed, toggleAutoplay,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocusCapture: () => setFocused(true),
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

function CarouselControls({ label, index, count, previous, next, setIndex, isPlaying, motionAllowed, toggleAutoplay }: { label: string; index: number; count: number; previous: () => void; next: () => void; setIndex: (index: number) => void; isPlaying: boolean; motionAllowed: boolean; toggleAutoplay: () => void }) {
  return <div className="home-carousel-controls" role="group" aria-label={`Controles de ${label}`}>
    <span className="home-carousel-count">{String(index + 1).padStart(2, "0")} <span>/ {String(count).padStart(2, "0")}</span></span>
    <div className="home-carousel-dots" role="group" aria-label={`Diapositivas de ${label}`}>{Array.from({ length: count }, (_, dot) => <button type="button" key={dot} aria-label={`Mostrar diapositiva ${dot + 1} de ${label}`} aria-current={index === dot ? "true" : undefined} className={index === dot ? "is-active" : ""} onClick={() => setIndex(dot)} />)}</div>
    <button className="home-carousel-toggle" type="button" aria-label={!motionAllowed ? `Avance automático de ${label} desactivado por movimiento reducido` : `${isPlaying ? "Pausar" : "Reanudar"} carrusel de ${label}`} title={!motionAllowed ? "Desactivado por tu preferencia de movimiento reducido" : undefined} onClick={toggleAutoplay} disabled={!motionAllowed}>{isPlaying ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}</button>
    <div className="home-carousel-arrows"><button type="button" aria-label={`Anterior en ${label}`} onClick={previous}><FiArrowLeft aria-hidden="true" /></button><button type="button" aria-label={`Siguiente en ${label}`} onClick={next}><FiArrowRight aria-hidden="true" /></button></div>
  </div>;
}

function HeroPreview() {
  return <div className="home-hero-visual" aria-label="Vista ilustrativa de un resumen de finanzas en Gastify">
    <div className="home-preview-window"><div className="home-preview-topbar"><span className="home-preview-brand"><span className="home-preview-brand-mark">G</span> Gastify</span><span className="home-preview-period">Octubre 2026 ⌄</span></div>
      <div className="home-preview-content"><div className="home-preview-eyebrow">TU PANORAMA</div><div className="home-preview-balance">$72,420<span>.00</span> <small>MXN</small></div><p>Una vista de lo que entra, sale y se queda contigo.</p>
        <div className="home-preview-stats"><div><span>Ingresos</span><strong>+$83,600</strong></div><div><span>Gastos</span><strong>−$32,180</strong></div><div><span>Balance del mes</span><strong>+$51,420</strong></div></div>
        <div className="home-preview-lower"><div className="home-preview-chart"><div className="home-preview-panel-heading"><strong>En qué se fue</strong><span>Ver análisis ↗</span></div>{categories.map((category) => <div className="home-preview-category" key={category.name}><div><span>{category.name}</span><b>{category.amount}</b></div><div className="home-preview-track"><span style={{ width: category.width, background: category.color }} /></div></div>)}</div><div className="home-preview-accounts"><div className="home-preview-panel-heading"><strong>Tus cuentas</strong><span>3 cuentas</span></div><div><span className="home-preview-dot" /> BBVA <b>$38,920</b></div><div><span className="home-preview-dot mint" /> Revolut USD <b>$1,180</b></div><div><span className="home-preview-dot coral" /> Santander <b>$12,160</b></div></div></div>
      </div>
    </div><div className="home-preview-note">Ejemplo visual · datos ficticios</div>
  </div>;
}

function FlowVisual({ kind }: { kind: typeof flowSlides[number]["kind"] }) {
  if (kind === "analyze") return <HistoryRender />;
  if (kind === "organize") return <div className="home-flow-visual home-flow-organize" aria-label="Ejemplo ilustrativo de movimientos agrupados por categoría"><div className="home-visual-topline"><FiLayers aria-hidden="true" /> Tus movimientos, a tu manera <span>OCTUBRE</span></div><div className="home-organize-row"><span className="home-organize-icon home-organize-purple">⌂</span><div><strong>Casa</strong><small>Renta · servicios · mantenimiento</small></div><b>$18,500</b></div><div className="home-organize-row"><span className="home-organize-icon home-organize-green">◈</span><div><strong>Despensa</strong><small>Supermercado · compras del hogar</small></div><b>$6,840</b></div><div className="home-organize-row"><span className="home-organize-icon home-organize-orange">↗</span><div><strong>Transporte</strong><small>Traslados · combustible</small></div><b>$3,260</b></div><div className="home-organize-footer"><span>Etiquetas</span><span># viaje-ejemplo</span><span># mensual</span><span><FiPlus aria-hidden="true" /> Nueva</span></div><small className="home-visual-disclaimer">Ejemplo visual · datos ficticios</small></div>;
  return <div className="home-flow-visual home-flow-import" aria-label="Ejemplo ilustrativo de registro e importación de movimientos"><div className="home-visual-topline"><FiFileText aria-hidden="true" /> Movimientos <span>+ Agregar</span></div><div className="home-import-row"><span className="home-import-icon">↓</span><div><strong>Importa tu archivo</strong><small>Excel o XML compatible</small></div><FiChevronRight aria-hidden="true" /></div><div className="home-import-divider"><span>o registra uno en segundos</span></div><div className="home-import-fields"><div><span>Concepto</span><strong>Café de la mañana</strong></div><div><span>Monto</span><strong>$85.00 MXN</strong></div></div><div className="home-import-save"><FiCheck aria-hidden="true" /> Movimiento registrado</div><small className="home-visual-disclaimer">Ejemplo visual · datos ficticios</small></div>;
}

function FeatureVisual({ kind }: { kind: typeof featureSlides[number]["kind"] }) {
  if (kind === "movements") return <MovementRender />;
  if (kind === "project") return <ProjectRender />;
  if (kind === "history") return <HistoryRender />;
  if (kind === "budgets") return <SpendingBudgetRender />;
  if (kind === "savings") return <SavingsGoalRender />;
  if (kind === "analyzer") return <WalletAnalyzerRender />;
  return <div className="home-currency-visual" aria-label="Ilustración de cuentas en distintas monedas"><div className="home-currency-header"><FiGlobe aria-hidden="true" /><span>TUS CUENTAS</span><span className="home-currency-primary">Vista principal: MXN ⌄</span></div><div className="home-currency-account"><span className="home-currency-badge">$</span><div><strong>Revolut</strong><small>Dólares estadounidenses</small></div><b>1,180.00 <small>USD</small></b></div><div className="home-currency-account"><span className="home-currency-badge euro">€</span><div><strong>Cuenta EUR</strong><small>Euros</small></div><b>840.00 <small>EUR</small></b></div><div className="home-currency-account"><span className="home-currency-badge yen">¥</span><div><strong>Cuenta JPY</strong><small>Yenes japoneses</small></div><b>24,000 <small>JPY</small></b></div><div className="home-currency-bottom">Cada saldo conserva su moneda original. Tus reportes siguen la moneda principal.</div><small className="home-visual-disclaimer">Ejemplo visual · datos ficticios</small></div>;
}

function AiAnswer({ kind }: { kind: typeof aiSlides[number]["kind"] }) {
  if (kind === "month") return <><p>En octubre gastaste <strong>$30,950</strong>, <strong>$4,560 más</strong> que en septiembre (+17 %). La categoría principal fue Casa.</p><div className="home-ai-result-stats"><div><small>OCTUBRE</small><strong>$30,950</strong></div><div><small>SEPTIEMBRE</small><strong>$26,390</strong></div><div><small>CAMBIO</small><strong className="coral">+17 %</strong></div></div><div className="home-ai-mini-table"><div><span>Categoría</span><span>Octubre</span><span>Del total</span></div><div><strong>Casa</strong><b>$18,500</b><span>60 %</span></div><div><strong>Restaurantes</strong><b>$4,100</b><span>13 %</span></div><div><strong>Transporte</strong><b>$3,260</b><span>11 %</span></div></div><div className="home-ai-insight">El gasto en Casa explica la mayor parte del total; podemos abrir sus movimientos para ver qué cambió.</div></>;
  if (kind === "register") return <><p>Listo. Registré el movimiento con los detalles que me diste:</p><div className="home-ai-receipt"><span className="home-ai-receipt-icon">↗</span><div><strong>Uber</strong><small>Transporte · BBVA Nómina</small></div><b>−$184.00 <small>MXN</small></b></div><div className="home-ai-insight success"><FiCheck aria-hidden="true" /> Movimiento agregado a Gastify.</div><p className="home-ai-next">También puedes pedir varios movimientos en un solo mensaje.</p></>;
  if (kind === "period") return <><p>Tus gastos pasaron de <strong>$24,650 en agosto</strong> a <strong>$30,950 en octubre</strong>: subieron cerca de <strong>26 %</strong> en el periodo.</p><div className="home-ai-period-bars"><div><span>AGO</span><i><b style={{ width: "72%" }} /></i><strong>$24,650</strong></div><div><span>SEP</span><i><b style={{ width: "82%" }} /></i><strong>$26,390</strong></div><div><span>OCT</span><i><b style={{ width: "96%" }} /></i><strong>$30,950</strong></div></div><div className="home-ai-insight">El aumento más marcado llegó en octubre. Puedo desglosarlo por categoría o comparar periodos completos.</div></>;
  return <><p>Encontré estos tres cargos de ejemplo en el archivo. Antes de registrarlos, revisemos categoría, cuenta y posibles duplicados:</p><div className="home-ai-mini-table home-ai-statement-table"><div><span>Movimiento</span><span>Fecha</span><span>Monto</span></div><div><strong>Súper La Comer</strong><span>21 oct</span><b>$1,480</b></div><div><strong>Uber</strong><span>20 oct</span><b>$184</b></div><div><strong>Farmacia San Pablo</strong><span>18 oct</span><b>$425</b></div></div><div className="home-ai-insight">Puedes confirmar los cargos y el asistente los registrará en lote. La lectura del archivo depende del asistente y del formato admitido.</div></>;
}

function AiConversation({ slide }: { slide: typeof aiSlides[number] }) {
  return <div className="home-ai-example" aria-label={`Ejemplo ilustrativo de IA: ${slide.eyebrow.toLowerCase()}`}><div className="home-ai-example-top"><span className="home-ai-pulse" /> Ejemplo de conversación · {slide.eyebrow.toLowerCase()}</div><div className="home-ai-question">“{slide.question}”</div><div className="home-ai-answer"><div className="home-ai-answer-logo">G</div><div className="home-ai-answer-body"><AiAnswer kind={slide.kind} /></div></div><div className="home-ai-example-bottom">Ejemplo ilustrativo · cifras y movimientos ficticios</div></div>;
}

export default function HomeSections() {
  const carouselEnvironment = useCarouselEnvironment();
  const hero = useCarousel(heroSlides.length, carouselEnvironment);
  const flow = useCarousel(flowSlides.length, carouselEnvironment);
  const feature = useCarousel(featureSlides.length, carouselEnvironment);
  const ai = useCarousel(aiSlides.length, carouselEnvironment);
  const heroSlide = heroSlides[hero.index];
  const flowSlide = flowSlides[flow.index];
  const featureSlide = featureSlides[feature.index];
  const aiSlide = aiSlides[ai.index];
  const heroSwipe = useSwipe(hero.previous, hero.next);
  const flowSwipe = useSwipe(flow.previous, flow.next);
  const featureSwipe = useSwipe(feature.previous, feature.next);
  const aiSwipe = useSwipe(ai.previous, ai.next);

  return <>
    <section className="home-hero home-shell home-chapter" aria-labelledby="home-hero-title" aria-roledescription="carrusel" {...heroSwipe} onMouseEnter={hero.onMouseEnter} onMouseLeave={hero.onMouseLeave} onFocusCapture={hero.onFocusCapture} onBlurCapture={hero.onBlurCapture}>
      <div className="home-hero-copy"><div className="home-hero-changing" aria-live={hero.isPlaying ? "off" : "polite"} aria-atomic="true" key={hero.index}><h1 id="home-hero-title">{heroSlide.title}</h1><p>{heroSlide.description}</p></div>
        <div className="home-hero-actions"><Link href="/register" className="home-button">Empieza con Gastify <FiArrowRight aria-hidden="true" /></Link><Link href="/demo" prefetch={false} aria-label="Explora Gastify con datos ficticios, sin registrarte" className="home-demo-link">Explora Gastify con datos ficticios <FiArrowRight aria-hidden="true" /></Link><a href="#como-funciona" className="home-text-link">Explora cómo funciona <span aria-hidden="true">↓</span></a></div>
        <div className="home-hero-assurance"><span className="home-pill"><span /> Descubre tus hábitos de gasto en un minuto</span><div className="home-hero-proof"><span><FiCheck aria-hidden="true" /> Categorías a tu medida</span><span><FiCheck aria-hidden="true" /> Importación y registro manual</span></div></div>
        <CarouselControls label="portada" index={hero.index} count={heroSlides.length} previous={hero.previous} next={hero.next} setIndex={hero.setIndex} isPlaying={hero.isPlaying} motionAllowed={hero.motionAllowed} toggleAutoplay={hero.toggleAutoplay} />
      </div>
      <div className="home-hero-media" key={heroSlide.visual}>{heroSlide.visual === "panorama" ? <HeroPreview /> : heroSlide.visual === "movements" ? <MovementRender /> : <ProjectRender />}</div>
    </section>

    <section className="home-story home-chapter" id="como-funciona" aria-labelledby="home-flow-title" onMouseEnter={flow.onMouseEnter} onMouseLeave={flow.onMouseLeave} onFocusCapture={flow.onFocusCapture} onBlurCapture={flow.onBlurCapture}><div className="home-shell home-story-inner"><div className="home-chapter-heading"><span className="home-eyebrow">02 / CÓMO FUNCIONA</span><span className="home-chapter-hint">Una idea a la vez. Desliza para explorar.</span></div>
      <div className="home-story-card" aria-roledescription="carrusel" aria-label="Cómo funciona Gastify" {...flowSwipe}><div className="home-story-copy" key={flow.index}><span className="home-story-number">{flowSlide.number}<i /></span><span className="home-feature-index">{flowSlide.eyebrow}</span><h2 id="home-flow-title">{flowSlide.title}</h2><p>{flowSlide.description}</p><span className="home-story-tip"><FiCheck aria-hidden="true" /> {flowSlide.tip}</span></div><div className="home-story-media" key={flowSlide.kind}><FlowVisual kind={flowSlide.kind} /></div></div>
      <CarouselControls label="cómo funciona" index={flow.index} count={flowSlides.length} previous={flow.previous} next={flow.next} setIndex={flow.setIndex} isPlaying={flow.isPlaying} motionAllowed={flow.motionAllowed} toggleAutoplay={flow.toggleAutoplay} />
    </div></section>

    <section className="home-showcase home-chapter" id="herramientas" aria-label="Herramientas de Gastify" onMouseEnter={feature.onMouseEnter} onMouseLeave={feature.onMouseLeave} onFocusCapture={feature.onFocusCapture} onBlurCapture={feature.onBlurCapture}><div className="home-shell"><div className="home-chapter-heading"><span className="home-eyebrow">03 / HERRAMIENTAS</span><span className="home-chapter-hint">Lo cotidiano y lo extraordinario, en la misma vista.</span></div>
      <div className="home-showcase-stage" aria-roledescription="carrusel" aria-label="Herramientas de Gastify" {...featureSwipe}><div className="home-feature-copy" key={feature.index}><span className="home-feature-index">{featureSlide.index} / {featureSlide.eyebrow}</span><h3>{featureSlide.title}</h3><p>{featureSlide.description}</p><ul>{featureSlide.points.map((point) => <li key={point}><FiCheck aria-hidden="true" /> {point}</li>)}</ul></div><div className="home-showcase-media" key={featureSlide.kind}><FeatureVisual kind={featureSlide.kind} /></div></div>
      <CarouselControls label="herramientas" index={feature.index} count={featureSlides.length} previous={feature.previous} next={feature.next} setIndex={feature.setIndex} isPlaying={feature.isPlaying} motionAllowed={feature.motionAllowed} toggleAutoplay={feature.toggleAutoplay} />
      <div className="home-tool-index" aria-label="Ir a una herramienta">{featureSlides.map((slide, index) => <button type="button" key={slide.kind} aria-current={index === feature.index ? "true" : undefined} onClick={() => feature.setIndex(index)}><span>{slide.index}</span>{slide.eyebrow}</button>)}</div>
    </div></section>

    <section className="home-ai home-chapter" id="inteligencia" aria-labelledby="home-ai-title" {...aiSwipe} onMouseEnter={ai.onMouseEnter} onMouseLeave={ai.onMouseLeave} onFocusCapture={ai.onFocusCapture} onBlurCapture={ai.onBlurCapture}><div className="home-shell home-ai-inner"><div className="home-ai-copy"><span className="home-eyebrow">04 / TU INFORMACIÓN, TUS PREGUNTAS</span><h2 id="home-ai-title">Lleva tus finanzas a tu propia IA.</h2><p>Conecta Gastify a un asistente compatible para consultar tus datos, comparar periodos o registrar movimientos. Tú generas y controlas la clave de acceso desde tu perfil.</p><p className="home-ai-footnote">Conexión opcional. Los ejemplos usan datos ficticios; las funciones disponibles pueden variar según el asistente.</p><Link href="/register" className="home-text-link">Crea tu cuenta <FiArrowRight aria-hidden="true" /></Link><div className="home-ai-takeaway" key={ai.index}><span>{aiSlide.eyebrow}</span><strong>{aiSlide.takeaway}</strong></div></div><div className="home-ai-stage" key={aiSlide.kind}><AiConversation slide={aiSlide} /></div><CarouselControls label="ejemplos de IA" index={ai.index} count={aiSlides.length} previous={ai.previous} next={ai.next} setIndex={ai.setIndex} isPlaying={ai.isPlaying} motionAllowed={ai.motionAllowed} toggleAutoplay={ai.toggleAutoplay} /></div></section>
  </>;
}
