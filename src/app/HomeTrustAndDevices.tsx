import Link from "next/link";
import { FiActivity, FiArrowRight, FiCheck, FiClock, FiKey, FiLock, FiShield, FiSmartphone, FiRefreshCw } from "react-icons/fi";
import HomeInstallButton from "./HomeInstallButton";
import type { Locale } from "@gastify/core/i18n/locales";

const securityFeaturesEs = [
  {
    icon: FiKey,
    title: "Entra con una passkey",
    text: "Inicia sesión con una passkey basada en WebAuthn, guardada en tu dispositivo o en tu gestor de llaves de acceso.",
  },
  {
    icon: FiLock,
    title: "Tu biometría se queda contigo",
    text: "Face ID, Touch ID o la huella solo desbloquean la passkey en tu dispositivo; Gastify no recibe ni guarda tu dato biométrico.",
  },
  {
    icon: FiShield,
    title: "Añade verificación en dos pasos",
    text: "Puedes proteger el acceso con una app autenticadora y conservar códigos de respaldo para recuperar tu cuenta.",
  },
  {
    icon: FiRefreshCw,
    title: "Confirma cambios importantes",
    text: "Para añadir o quitar passkeys o la verificación en dos pasos, Gastify solicita una comprobación reciente: los cambios sensibles tienen una ventana de 5 minutos.",
  },
];

const securityFeaturesEn = [
  { icon: FiKey, title: "Sign in with a passkey", text: "Sign in with a WebAuthn passkey saved on your device or in your passkey manager." },
  { icon: FiLock, title: "Your biometrics stay yours", text: "Face ID, Touch ID or your fingerprint only unlocks the passkey on your device; Gastify never receives or stores your biometric data." },
  { icon: FiShield, title: "Add two-step verification", text: "Protect access with an authenticator app and keep backup codes to recover your account." },
  { icon: FiRefreshCw, title: "Confirm important changes", text: "Adding or removing passkeys or two-step verification requires a recent check: sensitive changes have a 5-minute window." },
];

function SecuritySection({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const securityFeatures = en ? securityFeaturesEn : securityFeaturesEs;
  return <section className="home-security home-chapter" id="seguridad" aria-labelledby="home-security-title">
    <div className="home-shell home-security-inner">
      <div className="home-security-heading">
        <div>
          <span className="home-eyebrow">{en ? "SECURITY STARTS AT SIGN-IN" : "SEGURIDAD, DESDE EL ACCESO"}</span>
          <h2 id="home-security-title">{en ? "Your money deserves more than one lock." : "Tu dinero merece más de una cerradura."}</h2>
        </div>
        <p>{en ? "Gastify combines modern sign-in methods with sessions that periodically ask you to confirm it is really you." : "Gastify combina métodos modernos de acceso con una sesión que vuelve a pedirte confirmar que eres tú."}</p>
      </div>
      <div className="home-security-grid">
        {securityFeatures.map(({ icon: Icon, title, text }) => <article className="home-security-card" key={title}>
          <span className="home-security-icon"><Icon aria-hidden="true" /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>)}
      </div>
      <div className="home-session-rule">
        <span className="home-session-icon"><FiClock aria-hidden="true" /></span>
        <div><strong>{en ? "Sessions have limits, too." : "La sesión también tiene límites."}</strong><p>{en ? "After 15 minutes of inactivity, Gastify asks you to verify again. Even while you are active, it will ask again at least every 12 hours." : "Si pasan 15 minutos sin actividad, Gastify vuelve a pedir una verificación. Aunque sigas usando la app, te la pedirá de nuevo a más tardar cada 12 horas."}</p></div>
          <span className="home-session-check"><FiCheck aria-hidden="true" /> {en ? "Configured safeguards" : "Reglas configuradas"}</span>
      </div>
      <p className="home-security-note"><FiActivity aria-hidden="true" /> {en ? "Manage your sign-in and verification methods from your profile." : "Puedes administrar tus métodos de acceso y verificación desde tu perfil."}</p>
    </div>
  </section>;
}

function BudgetRow({ label, amount, percent, tone }: { label: string; amount: string; percent: number; tone: "mint" | "violet" | "blue" }) {
  return <div className="home-device-budget-row"><div><span>{label}</span><strong>{amount}</strong></div><div className="home-device-track"><i className={tone} style={{ width: `${percent}%` }} /></div></div>;
}

function PhoneMockup({ platform, locale }: { platform: "android" | "iphone"; locale: Locale }) {
  const iphone = platform === "iphone";
  const en = locale === "en";
  return <figure className={`home-device-figure home-device-figure-phone ${iphone ? "is-iphone" : "is-android"}`}>
    <div className={`home-device-shell ${iphone ? "home-device-iphone" : "home-device-android"}`} role="img" aria-label={en ? `Illustrative view of Gastify on ${iphone ? "iPhone" : "Android"}` : `Vista ilustrativa de Gastify en ${iphone ? "iPhone" : "Android"}`}>
      <div className="home-device-screen" aria-hidden="true">
        <div className="home-device-status"><span>9:41</span><span>▮ ▮ ▰</span></div>
        {iphone && <span className="home-device-island" />}
        <div className="home-device-appbar"><span className="home-device-mark">G</span><strong>Gastify</strong><span>{en ? "OCT 2026" : "OCT 2026"}⌄</span></div>
        <div className="home-device-phone-body">
          {iphone ? <>
            <span className="home-device-eyebrow">{en ? "BUDGETS" : "PRESUPUESTOS"}</span>
            <h3>{en ? "You're on track." : "Vas a buen ritmo."}</h3>
            <div className="home-device-highlight"><span>{en ? "Monthly spending" : "Gasto del mes"}</span><strong>$18,420 <small>MXN</small></strong><div className="home-device-track"><i className="mint" style={{ width: "58%" }} /></div><small>{en ? "58% of overall limit" : "58 % del límite general"}</small></div>
            <BudgetRow label={en ? "Home" : "Casa"} amount="$12,400 / $18,000" percent={69} tone="violet" />
            <BudgetRow label={en ? "Restaurants" : "Restaurantes"} amount="$2,140 / $4,500" percent={48} tone="mint" />
            <BudgetRow label={en ? "Transport" : "Transporte"} amount="$980 / $2,000" percent={49} tone="blue" />
            <div className="home-device-phone-nav"><span>⌂<small>{en ? "Home" : "Inicio"}</small></span><span>▤<small>{en ? "Transactions" : "Movimientos"}</small></span><b>＋</b><span>◷<small>{en ? "History" : "Historial"}</small></span><span>•••<small>{en ? "More" : "Más"}</small></span></div>
          </> : <>
            <span className="home-device-eyebrow">{en ? "YOUR OVERVIEW" : "TU PANORAMA"}</span>
            <strong className="home-device-mobile-balance">$72,420<small>.00 MXN</small></strong>
            <span className="home-device-muted">{en ? "What comes in, goes out and stays with you." : "Lo que entra, sale y se queda contigo."}</span>
            <div className="home-device-mini-stats"><span><small>{en ? "Income" : "Ingresos"}</small><b>+$83,600</b></span><span><small>{en ? "Spending" : "Gastos"}</small><b>−$32,180</b></span></div>
            <div className="home-device-mobile-card"><div className="home-device-card-title"><strong>{en ? "This month" : "Este mes"}</strong><span>{en ? "View analysis" : "Ver análisis"} ↗</span></div><div className="home-device-sparkline"><i /><i /><i /><i /><i /><i /><i /><i /></div><BudgetRow label={en ? "Home" : "Casa"} amount="$18,500" percent={78} tone="violet" /><BudgetRow label={en ? "Groceries" : "Despensa"} amount="$6,840" percent={55} tone="mint" /></div>
            <div className="home-device-mobile-card"><div className="home-device-card-title"><strong>{en ? "Recent transactions" : "Últimos movimientos"}</strong><span>{en ? "View all" : "Ver todos"}</span></div><div className="home-device-transaction"><span className="home-device-transaction-dot mint" /><span>{en ? "Supermarket" : "Supermercado"}<small>{en ? "Groceries · Today" : "Despensa · Hoy"}</small></span><b>−$1,240</b></div><div className="home-device-transaction"><span className="home-device-transaction-dot violet" /><span>Uber<small>{en ? "Transport · Yesterday" : "Transporte · Ayer"}</small></span><b>−$184</b></div></div>
            <div className="home-device-android-nav"><i /><i /><i /></div>
          </>}
        </div>
      </div>
    </div>
    <figcaption>{iphone ? (en ? "iPhone · budgets and goals at a glance" : "iPhone · budgets y metas al día") : (en ? "Android · your finances at a glance" : "Android · tu panorama en cualquier momento")}</figcaption>
  </figure>;
}

function TabletMockup({ locale }: { locale: Locale }) {
  const en = locale === "en";
  return <figure className="home-device-figure home-device-figure-tablet">
    <div className="home-device-shell home-device-tablet" role="img" aria-label={en ? "Illustrative view of Gastify on iPad and tablet" : "Vista ilustrativa de Gastify en iPad y tablet"}>
      <div className="home-device-screen" aria-hidden="true">
        <div className="home-device-tablet-top"><span className="home-device-mark">G</span><strong>Gastify</strong><nav><span>{en ? "Home" : "Inicio"}</span><span>{en ? "Budgets" : "Presupuestos"}</span><span>{en ? "History" : "Historial"}</span></nav><b>{en ? "OCTOBER 2026" : "OCTUBRE 2026"}⌄</b></div>
        <div className="home-device-tablet-content">
          <div className="home-device-tablet-greeting"><div><span className="home-device-eyebrow">{en ? "YOUR OVERVIEW" : "TU PANORAMA"}</span><h3>{en ? "Your month at a glance" : "Así va tu mes"}</h3></div><span className="home-device-muted">{en ? "October 2026" : "Octubre 2026"}</span></div>
          <div className="home-device-tablet-balance"><span>{en ? "Monthly balance" : "Balance del mes"}</span><strong>$72,420.00 <small>MXN</small></strong><div><span>{en ? "Income" : "Ingresos"} <b>+$83,600</b></span><span>{en ? "Spending" : "Gastos"} <b>−$32,180</b></span></div></div>
          <div className="home-device-tablet-grid">
            <section><div className="home-device-card-title"><strong>{en ? "Spending by category" : "Gasto por categoría"}</strong><span>{en ? "View analysis" : "Ver análisis"} ↗</span></div><BudgetRow label={en ? "Home" : "Casa"} amount="$18,500" percent={84} tone="violet" /><BudgetRow label={en ? "Groceries" : "Despensa"} amount="$6,840" percent={62} tone="mint" /><BudgetRow label={en ? "Transport" : "Transporte"} amount="$3,260" percent={42} tone="blue" /><BudgetRow label={en ? "Restaurants" : "Restaurantes"} amount="$2,140" percent={34} tone="mint" /></section>
            <section><div className="home-device-card-title"><strong>{en ? "Your accounts" : "Tus cuentas"}</strong><span>{en ? "3 accounts" : "3 cuentas"}</span></div><div className="home-device-account"><i className="violet" /> BBVA <b>$38,920</b></div><div className="home-device-account"><i className="mint" /> Revolut USD <b>$1,180</b></div><div className="home-device-account"><i className="coral" /> Santander <b>$12,160</b></div><div className="home-device-tablet-chart"><span>{en ? "Income and spending" : "Ingresos y gastos"}</span><div>{[42, 68, 48, 82, 58, 91, 72, 64, 86, 55, 76, 96].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><small>{en ? "May · Jun · Jul · Aug · Sep · Oct" : "May · Jun · Jul · Ago · Sep · Oct"}</small></div></section>
          </div>
        </div>
      </div>
    </div>
    <figcaption>{locale === "en" ? "iPad and tablets · more room to see the big picture" : "iPad y tabletas · más espacio para ver el conjunto"}</figcaption>
  </figure>;
}

function DevicesSection({ locale }: { locale: Locale }) {
  const en = locale === "en";
  return <section className="home-devices home-chapter" id="dispositivos" aria-labelledby="home-devices-title">
    <div className="home-shell home-devices-inner">
      <div className="home-devices-heading">
        <div><span className="home-eyebrow">{en ? "WITH YOU ON EVERY SCREEN" : "CONTIGO, EN CADA PANTALLA"}</span><h2 id="home-devices-title">{en ? "Gastify fits your day." : "Gastify se adapta a tu día."}</h2><p>{en ? "Use Gastify in your browser or mobile app on iPhone and Android; it also adapts to iPad and other tablets. You can add the web app to your home screen and open it like an app." : "Úsala desde el navegador o la app móvil en iPhone y Android; también se acomoda a iPad y otras tabletas. Y si prefieres, añade la versión web a tu pantalla de inicio para abrirla como una app."}</p></div>
      </div>
      <div className="home-install-row"><HomeInstallButton locale={locale} /></div>
      <div className="home-device-gallery">
        <PhoneMockup platform="android" locale={locale} />
        <PhoneMockup platform="iphone" locale={locale} />
        <TabletMockup locale={locale} />
      </div>
      <div className="home-devices-footnote"><FiSmartphone aria-hidden="true" /> {en ? "The web app adapts to each screen; these are illustrative views of the mobile and tablet experience." : "La versión web se adapta a cada pantalla; las vistas son ejemplos ilustrativos de la experiencia móvil y tablet."} <Link href="/register">{en ? "Get started with Gastify" : "Empieza con Gastify"} <FiArrowRight aria-hidden="true" /></Link></div>
      <small className="home-device-disclaimer">{en ? "Visual examples · fictional data · illustrative interface" : "Ejemplos visuales · datos ficticios · interfaz ilustrativa"}</small>
    </div>
  </section>;
}

export default function HomeTrustAndDevices({ locale }: { locale: Locale }) {
  return <>
    <SecuritySection locale={locale} />
    <DevicesSection locale={locale} />
  </>;
}
