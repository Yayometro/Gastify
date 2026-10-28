import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FiArrowRight, FiArrowUpRight, FiCompass, FiLayers, FiLock, FiSliders } from "react-icons/fi";
import HomeSections from "./HomeSections";
import "./home.css";
import "./home-renders.css";
import "./home-demo.css";

export const metadata: Metadata = {
  title: "Gastify | Entiende tu dinero. Planea lo que sigue.",
  description: "Organiza movimientos, cuentas, presupuestos y proyectos. Analiza tus finanzas personales en pesos, dólares, euros y yenes con Gastify.",
};

export default function Home() {
  return <main className="gf-home" id="inicio">
    <header className="home-header"><div className="home-shell home-header-inner">
      <Link href="/" className="home-logo" aria-label="Gastify, inicio"><Image src="/oficial/Gastify-full-white.PNG" alt="Gastify" width={146} height={72} priority /></Link>
      <nav className="home-desktop-nav" aria-label="Secciones de la página"><a href="#como-funciona">Cómo funciona</a><a href="#herramientas">Herramientas</a><a href="#inteligencia">Tu IA</a><Link href="/demo" prefetch={false} className="home-header-demo">Probar demo</Link></nav>
      <div className="home-header-actions"><Link href="/login" className="home-header-login">Iniciar sesión</Link><Link href="/register" className="home-button home-button-small">Crear cuenta <FiArrowUpRight aria-hidden="true" /></Link></div>
    </div></header>

    <HomeSections />

    <section className="home-demo-section home-chapter" id="demo" aria-labelledby="home-demo-title">
      <div className="home-shell home-demo-inner">
        <div className="home-demo-copy">
          <span className="home-eyebrow">GASTIFY INTERACTIVO</span>
          <h2 id="home-demo-title">Conoce Gastify por dentro, antes de crear tu cuenta.</h2>
          <p>Explora una muestra del dashboard con información ficticia. Cambia de sección, revisa detalles y prueba los controles sin conectar tus cuentas.</p>
          <div className="home-demo-actions">
            <Link href="/demo" prefetch={false} className="home-button">Abrir demo interactiva <FiArrowRight aria-hidden="true" /></Link>
            <span className="home-demo-safety"><FiLock aria-hidden="true" /> Sin registro ni datos personales</span>
          </div>
        </div>
        <div className="home-demo-capabilities" aria-label="Qué puedes explorar en la demo">
          <article><FiLayers aria-hidden="true" /><div><h3>Un recorrido por la app</h3><p>Dashboard, movimientos, cuentas, categorías e historial.</p></div></article>
          <article><FiSliders aria-hidden="true" /><div><h3>Presupuestos y análisis</h3><p>Budgets, ahorro, proyectos, proyecciones y Wallet Analyzer.</p></div></article>
          <article><FiLock aria-hidden="true" /><div><h3>Prueba segura</h3><p>Filtros, periodos, detalles y vistas de ejemplo. Los formularios son una vista previa: no guardan cambios.</p></div></article>
        </div>
      </div>
    </section>

    <section className="home-end home-chapter" aria-labelledby="home-end-title"><div className="home-end-inner home-shell"><div className="home-end-icon"><FiCompass aria-hidden="true" /></div><span className="home-eyebrow">EL SIGUIENTE PASO ES TUYO</span><h2 id="home-end-title">Dale contexto a cada peso.</h2><p>Empieza por registrar un movimiento. Después deja que el panorama completo aparezca.</p><div className="home-end-actions"><Link href="/register" className="home-button">Crear mi cuenta <FiArrowRight aria-hidden="true" /></Link><Link href="/demo" prefetch={false} className="home-text-link">Primero quiero probar Gastify <FiArrowRight aria-hidden="true" /></Link><Link href="/login" className="home-text-link">Ya tengo cuenta</Link></div></div></section>
    <footer className="home-footer"><div className="home-shell home-footer-inner"><Link href="/" className="home-footer-brand">Gastify<span>®</span></Link><p>Finanzas personales con más contexto.</p><div><span>© {new Date().getFullYear()} Gastify</span><a href="https://www.linkedin.com/in/luisjairvazquezn/" target="_blank" rel="noopener noreferrer">Contacto <FiArrowUpRight aria-hidden="true" /></a></div></div></footer>
  </main>;
}
