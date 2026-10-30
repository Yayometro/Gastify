"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiPlus } from "react-icons/fi";
import type { Locale } from "@gastify/core/i18n/locales";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform?: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};
type InstallPlatform = "ios" | "android" | "desktop";

function getPlatform(): InstallPlatform {
  const userAgent = navigator.userAgent.toLowerCase();
  const isAppleMobile = /iphone|ipad|ipod/.test(userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isAppleMobile) return "ios";
  if (/android/.test(userAgent)) return "android";
  return "desktop";
}

export default function HomeInstallButton({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>("desktop");
  const [showInstructions, setShowInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
    if (standaloneNavigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    setPlatform(getPlatform());

    if (!installPrompt) {
      setShowInstructions((open) => !open);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } catch {
      setShowInstructions(true);
    }
  };

  const instructions = platform === "ios"
    ? (en ? "In Safari, tap Share and choose “Add to Home Screen”. Gastify will be one tap away, like an app." : "En Safari, toca Compartir y elige “Añadir a pantalla de inicio”. Así Gastify queda a un toque, como una app.")
    : platform === "android"
      ? (en ? "In Chrome, open the ⋮ menu and tap “Install app” or “Add to Home Screen”." : "En Chrome, abre el menú ⋮ y toca “Instalar app” o “Añadir a pantalla de inicio”.")
      : (en ? "In Chrome or Edge, use the install icon in the address bar. You can also choose “Install Gastify” from the browser menu." : "En Chrome o Edge, usa el icono de instalación de la barra de direcciones. También puedes elegir “Instalar Gastify” en el menú del navegador.");

  return <div className="home-install-control">
    <button className="home-button home-install-button" type="button" onClick={install} aria-expanded={showInstructions} aria-controls="home-install-instructions" disabled={installed}>
      {installed ? <FiCheck aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
      {installed ? (en ? "Gastify is on your home screen" : "Gastify ya está en tu inicio") : installPrompt ? (en ? "Install Gastify" : "Instalar Gastify") : (en ? "Add Gastify to home screen" : "Añadir Gastify a inicio")}
    </button>
    {showInstructions && <div className="home-install-instructions" id="home-install-instructions" role="status" aria-live="polite">
      <strong>{en ? "An app-like shortcut" : "Un acceso directo, como una app"}</strong>
      <p>{instructions}</p>
      <button type="button" onClick={() => setShowInstructions(false)}>{en ? "Got it" : "Entendido"}</button>
    </div>}
  </div>;
}
