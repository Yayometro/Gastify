import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FiArrowRight, FiArrowUpRight, FiCompass, FiLayers, FiLock, FiSliders } from "react-icons/fi";
import HomeSections from "./HomeSections";
import HomeTrustAndDevices from "./HomeTrustAndDevices";
import LanguageSwitch from "@/i18n/LanguageSwitch";
import { currentLocale } from "@/i18n/server";
import "./home.css";
import "./home-renders.css";
import "./home-demo.css";
import "./home-platform.css";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await currentLocale()) === "en";
  return {
    title: en ? "Gastify | Understand your money. Plan what comes next." : "Gastify | Entiende tu dinero. Planea lo que sigue.",
    description: en
      ? "Organize transactions, accounts, budgets and projects. Understand your personal finances across pesos, dollars, euros and yen with Gastify."
      : "Organiza movimientos, cuentas, presupuestos y proyectos. Analiza tus finanzas personales en pesos, dólares, euros y yenes con Gastify.",
  };
}

export default async function Home() {
  const locale = await currentLocale();
  const en = locale === "en";
  return <main className="gf-home" id="inicio">
    <header className="home-header"><div className="home-shell home-header-inner">
      <Link href="/" className="home-logo" aria-label="Gastify, inicio"><Image src="/oficial/Gastify-full-white.PNG" alt="Gastify" width={146} height={72} priority /></Link>
      <nav className="home-desktop-nav" aria-label={en ? "Page sections" : "Secciones de la página"}><a href="#como-funciona">{en ? "How it works" : "Cómo funciona"}</a><a href="#herramientas">{en ? "Tools" : "Herramientas"}</a><a href="#inteligencia">{en ? "Your AI" : "Tu IA"}</a><a href="#seguridad">{en ? "Security" : "Seguridad"}</a><a href="#dispositivos">{en ? "Mobile app" : "App móvil"}</a><Link href="/demo" prefetch={false} className="home-header-demo">{en ? "Try the demo" : "Probar demo"}</Link></nav>
      <div className="home-header-actions"><LanguageSwitch compact className="home-language-switch" /><Link href="/login" className="home-header-login">{en ? "Log in" : "Iniciar sesión"}</Link><Link href="/register" className="home-button home-button-small">{en ? "Create account" : "Crear cuenta"} <FiArrowUpRight aria-hidden="true" /></Link></div>
    </div></header>

    <HomeSections locale={locale} />

    <section className="home-demo-section home-chapter" id="demo" tabIndex={-1} aria-labelledby="home-demo-title">
      <div className="home-shell home-demo-inner">
        <div className="home-demo-copy">
          <span className="home-eyebrow">{en ? "INTERACTIVE GASTIFY" : "GASTIFY INTERACTIVO"}</span>
          <h2 id="home-demo-title">{en ? "Explore Gastify before creating an account." : "Conoce Gastify por dentro, antes de crear tu cuenta."}</h2>
          <p>{en ? "Explore a sample dashboard with fictional information. Switch sections, review details and try the controls without connecting your accounts." : "Explora una muestra del dashboard con información ficticia. Cambia de sección, revisa detalles y prueba los controles sin conectar tus cuentas."}</p>
          <div className="home-demo-actions">
            <Link href="/demo" prefetch={false} className="home-button">{en ? "Open interactive demo" : "Abrir demo interactiva"} <FiArrowRight aria-hidden="true" /></Link>
            <span className="home-demo-safety"><FiLock aria-hidden="true" /> {en ? "No sign-up or personal data" : "Sin registro ni datos personales"}</span>
          </div>
        </div>
        <div className="home-demo-capabilities" aria-label={en ? "What you can explore in the demo" : "Qué puedes explorar en la demo"}>
          <article><FiLayers aria-hidden="true" /><div><h3>{en ? "A tour of the app" : "Un recorrido por la app"}</h3><p>{en ? "Dashboard, transactions, accounts, categories and history." : "Dashboard, movimientos, cuentas, categorías e historial."}</p></div></article>
          <article><FiSliders aria-hidden="true" /><div><h3>{en ? "Budgets and analysis" : "Presupuestos y análisis"}</h3><p>{en ? "Savings, projects, forecasts and Wallet Analyzer." : "Budgets, ahorro, proyectos, proyecciones y Wallet Analyzer."}</p></div></article>
          <article><FiLock aria-hidden="true" /><div><h3>{en ? "A safe preview" : "Prueba segura"}</h3><p>{en ? "Filters, periods, details and sample views. Forms are previews and do not save changes." : "Filtros, periodos, detalles y vistas de ejemplo. Los formularios son una vista previa: no guardan cambios."}</p></div></article>
        </div>
      </div>
    </section>

    <HomeTrustAndDevices locale={locale} />

    <section className="home-end home-chapter" aria-labelledby="home-end-title"><div className="home-end-inner home-shell"><div className="home-end-icon"><FiCompass aria-hidden="true" /></div><span className="home-eyebrow">{en ? "THE NEXT STEP IS YOURS" : "EL SIGUIENTE PASO ES TUYO"}</span><h2 id="home-end-title">{en ? "Give every dollar context." : "Dale contexto a cada peso."}</h2><p>{en ? "Start by recording a transaction. Then let the bigger picture emerge." : "Empieza por registrar un movimiento. Después deja que el panorama completo aparezca."}</p><div className="home-end-actions"><Link href="/register" className="home-button">{en ? "Create my account" : "Crear mi cuenta"} <FiArrowRight aria-hidden="true" /></Link><Link href="/demo" prefetch={false} className="home-text-link">{en ? "I'd like to try Gastify first" : "Primero quiero probar Gastify"} <FiArrowRight aria-hidden="true" /></Link><Link href="/login" className="home-text-link">{en ? "I already have an account" : "Ya tengo cuenta"}</Link></div></div></section>
    <footer className="home-footer"><div className="home-shell home-footer-inner"><Link href="/" className="home-footer-brand">Gastify<span>®</span></Link><p>{en ? "Personal finance, with more context." : "Finanzas personales con más contexto."}</p><div><span>© {new Date().getFullYear()} Gastify</span><a href="https://www.linkedin.com/in/luisjairvazquezn/" target="_blank" rel="noopener noreferrer">{en ? "Contact" : "Contacto"} <FiArrowUpRight aria-hidden="true" /></a></div></div></footer>
  </main>;
}
