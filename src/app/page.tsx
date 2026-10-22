import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FiArrowRight, FiArrowUpRight, FiCompass } from "react-icons/fi";
import HomeSections from "./HomeSections";
import "./home.css";
import "./home-renders.css";

export const metadata: Metadata = {
  title: "Gastify | Entiende tu dinero. Planea lo que sigue.",
  description: "Organiza movimientos, cuentas, presupuestos y proyectos. Analiza tus finanzas personales en pesos, dólares, euros y yenes con Gastify.",
};

export default function Home() {
  return <main className="gf-home" id="inicio">
    <header className="home-header"><div className="home-shell home-header-inner">
      <Link href="/" className="home-logo" aria-label="Gastify, inicio"><Image src="/oficial/Gastify-full-white.PNG" alt="Gastify" width={146} height={72} priority /></Link>
      <nav className="home-desktop-nav" aria-label="Secciones de la página"><a href="#como-funciona">Cómo funciona</a><a href="#herramientas">Herramientas</a><a href="#inteligencia">Tu IA</a></nav>
      <div className="home-header-actions"><Link href="/login" className="home-header-login">Iniciar sesión</Link><Link href="/register" className="home-button home-button-small">Crear cuenta <FiArrowUpRight aria-hidden="true" /></Link></div>
    </div></header>

    <HomeSections />

    <section className="home-end home-chapter" aria-labelledby="home-end-title"><div className="home-end-inner home-shell"><div className="home-end-icon"><FiCompass aria-hidden="true" /></div><span className="home-eyebrow">EL SIGUIENTE PASO ES TUYO</span><h2 id="home-end-title">Dale contexto a cada peso.</h2><p>Empieza por registrar un movimiento. Después deja que el panorama completo aparezca.</p><div className="home-end-actions"><Link href="/register" className="home-button">Crear mi cuenta <FiArrowRight aria-hidden="true" /></Link><Link href="/login" className="home-text-link">Ya tengo cuenta</Link></div></div></section>
    <footer className="home-footer"><div className="home-shell home-footer-inner"><Link href="/" className="home-footer-brand">Gastify<span>®</span></Link><p>Finanzas personales con más contexto.</p><div><span>© {new Date().getFullYear()} Gastify</span><a href="https://www.linkedin.com/in/luisjairvazquezn/" target="_blank" rel="noopener noreferrer">Contacto <FiArrowUpRight aria-hidden="true" /></a></div></div></footer>
  </main>;
}
