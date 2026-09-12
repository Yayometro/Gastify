"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Spin } from "antd";
import QRCode from "qrcode";
import { authClient } from "@/lib/auth/authClient";
import runNotify from "@/helpers/gastifyNotifier";
import downloadBackupCodes from "@/helpers/downloadBackupCodes";
import CategoIcon from "./CategoIcon";

// Same collapsible-panel pattern as PasskeysPanel/ApiTokensPanel - manage
// TOTP (authenticator app) + backup codes from the Profile page, outside
// the login/step-up flow. `authClient.useSession()`'s `user.twoFactorEnabled`
// (a Better Auth built-in field, from the twoFactor plugin's own schema)
// is the source of truth for whether this is already set up.
function TwoFactorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, refetch } = authClient.useSession();
  const { data: passkeys } = authClient.useListPasskeys();
  const twoFactorEnabled = Boolean(session?.user?.twoFactorEnabled);
  const hasPasskey = Boolean(passkeys && passkeys.length > 0);

  // null | "password-enable" | "scan" | "confirm-done" | "password-disable" | "password-regenerate"
  const [setupStep, setSetupStep] = useState(null);
  const [totpSetup, setTotpSetup] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState(null);

  // Reads the password straight off the native form field instead of
  // trusting the React-controlled `password` state alone. Found live: a
  // password pasted (or filled by the browser's own password manager) can
  // land in the visible input without React's onChange ever firing -
  // controlled state stays stale/empty while the field looks correctly
  // filled - so the request silently sent no password at all and came back
  // "Contraseña incorrecta" for a password that was actually correct. The
  // form's own current value is the source of truth at submit time.
  function readFormPassword(e) {
    return e?.target?.elements?.password?.value || password;
  }

  // Every migrated Gastify account got its old NextAuth password carried
  // over during the Better Auth migration, whether or not the person has
  // ever actually used it (plenty only ever sign in via Google) - so
  // "confirm your password" can strand someone who genuinely doesn't know
  // it. The Profile page's own "Change password?" toggle already sets a new
  // one without needing the old one (see general-data/user/update-user's
  // use of auth.api.setPassword) - this just points people at it instead of
  // leaving them stuck.
  function scrollToChangePassword() {
    // ProfileClient owns the toggle's open/closed state (it's a sibling
    // component here, not a parent) - a custom event asks it to flip the
    // toggle open and scroll to it, rather than this component reaching
    // into ProfileClient's DOM directly and finding a collapsed, invisible
    // section with nothing to actually scroll to.
    window.dispatchEvent(new Event("gf:open-change-password"));
  }

  // Better Auth's twoFactor plugin requires a password to confirm both
  // enabling AND disabling 2FA - `allowPasswordless: true` (see
  // betterAuth.js) only skips that for an account with NO password
  // credential at all. Whether an account is in that state can't be
  // determined ahead of time from the client: `/list-accounts` reports
  // that a "credential" account exists but never whether it actually has a
  // password set (an account can exist password-less, e.g. after clearing
  // one), so a client-side guess used to show this prompt even when it
  // wasn't needed. Instead, every action here is optimistic - called first
  // with no password at all - and only asks for one on an actual
  // INVALID_PASSWORD response, which is the one place that's genuinely
  // authoritative.
  const handleStartSetup = async (e) => {
    e?.preventDefault?.();
    const currentPassword = readFormPassword(e);
    try {
      setIsLoading(true);
      const { data, error } = await authClient.twoFactor.enable({ method: "totp", password: currentPassword || undefined });
      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          // Only a real wrong-password attempt gets a toast - the very
          // first, password-less try failing this way just means the
          // account has one on file, nothing "incorrect" happened yet.
          if (currentPassword) runNotify("error", "Contraseña incorrecta 🤕");
          setSetupStep("password-enable");
        } else {
          runNotify("error", error.message || "No se pudo iniciar la configuración 🤕");
        }
        return;
      }
      setPassword("");
      setTotpSetup(data);
      const dataUrl = await QRCode.toDataURL(data.totpURI);
      setQrDataUrl(dataUrl);
      setSetupStep("scan");
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        runNotify("error", error.message || "Código incorrecto 🤕");
        return;
      }
      runNotify("ok", "Verificación en dos pasos activada 🤓");
      setSetupStep("confirm-done");
      setCode("");
      refetch();
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e?.preventDefault?.();
    const currentPassword = readFormPassword(e);
    try {
      setIsLoading(true);
      const { error } = await authClient.twoFactor.disable({ password: currentPassword || undefined });
      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          if (currentPassword) runNotify("error", "Contraseña incorrecta 🤕");
          setSetupStep("password-disable");
        } else {
          runNotify("error", error.message || "No se pudo desactivar 🤕");
        }
        return;
      }
      runNotify("ok", "Verificación en dos pasos desactivada 🤓");
      setPassword("");
      setSetupStep(null);
      setTotpSetup(null);
      refetch();
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Same password gate as enable/disable above - generateBackupCodes hits
  // it too.
  const handleRegenerateBackupCodes = async (e) => {
    e?.preventDefault?.();
    const currentPassword = readFormPassword(e);
    try {
      setIsLoading(true);
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password: currentPassword || undefined });
      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          if (currentPassword) runNotify("error", "Contraseña incorrecta 🤕");
          setSetupStep("password-regenerate");
        } else {
          runNotify("error", error.message || "No se pudieron regenerar los códigos 🤕");
        }
        return;
      }
      setPassword("");
      setSetupStep(null);
      setNewBackupCodes(data.backupCodes);
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Disabling 2FA or regenerating backup codes on a password-less account
  // (allowPasswordless: true) used to go through with zero re-verification
  // at all - the optimistic password check simply succeeds when there's no
  // password to ask for, which is right for enabling (adding security
  // needs no extra gate) but wrong for these two: they're the ones an
  // attacker sitting on a hijacked session would want. A registered
  // passkey is a stronger, no-typing factor that's already available here,
  // so it's asked for first whenever one exists - covering the exact gap a
  // passwordless account would otherwise have - and only falls through to
  // the plain (password-if-any) flow when there's no passkey to check
  // against.
  async function handleDisableSecurely() {
    if (!hasPasskey) return handleDisable();
    try {
      setIsLoading(true);
      const { error } = await authClient.signIn.passkey();
      if (error) {
        runNotify("error", error.message || "No se pudo verificar tu passkey 🤕");
        return;
      }
    } catch (err) {
      runNotify("error", String(err));
      return;
    } finally {
      setIsLoading(false);
    }
    return handleDisable();
  }

  async function handleRegenerateBackupCodesSecurely() {
    if (!hasPasskey) return handleRegenerateBackupCodes();
    try {
      setIsLoading(true);
      const { error } = await authClient.signIn.passkey();
      if (error) {
        runNotify("error", error.message || "No se pudo verificar tu passkey 🤕");
        return;
      }
    } catch (err) {
      runNotify("error", String(err));
      return;
    } finally {
      setIsLoading(false);
    }
    return handleRegenerateBackupCodes();
  }

  return (
    <div className="two-factor-panel w-full bg-gf-accent-soft-bg rounded-3xl p-4 mb-4">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="text-xl text-purple-300 font-normal">Autenticación en dos pasos</h2>
        <CategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <p className="text-xs text-gf-text-muted mb-3">
            Además de tu passkey, puedes activar una app autenticadora (Google Authenticator, Microsoft
            Authenticator, etc.) como método de verificación adicional.
          </p>

          {!setupStep && (
            <div className="bg-gf-surface rounded-2xl p-3 flex justify-between items-center">
              <p className="text-sm text-gf-text">
                Estado: <span className={twoFactorEnabled ? "text-green-400 font-semibold" : "text-gf-text-muted"}>{twoFactorEnabled ? "Activada" : "No activada"}</span>
              </p>
              {twoFactorEnabled ? (
                <button
                  type="button"
                  disabled={isLoading}
                  className="gf-glass-button-danger text-white text-xs rounded-full px-4 py-2"
                  onClick={() => handleDisableSecurely()}
                >
                  {isLoading ? <Spin /> : "Desactivar"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  className="gf-glass-button text-white text-xs rounded-full px-4 py-2"
                  onClick={() => handleStartSetup()}
                >
                  {isLoading ? <Spin /> : "Activar"}
                </button>
              )}
            </div>
          )}

          {setupStep === "password-enable" && (
            <div className="bg-gf-surface rounded-2xl p-3 flex flex-col items-center gap-3">
              <p className="text-xs text-gf-text-muted text-center">
                Tu cuenta tiene una contraseña configurada. Confírmala para activar la verificación en dos pasos.
              </p>
              <form onSubmit={handleStartSetup} className="form-trans-edit w-full flex flex-col gap-2 items-center">
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 w-full">
                  <button type="submit" disabled={isLoading} className="gf-glass-button text-white text-xs rounded-full px-4 py-2 grow">
                    {isLoading ? <Spin /> : "Continuar"}
                  </button>
                  <button type="button" className="text-[11px] text-gf-text-muted underline" onClick={() => { setSetupStep(null); setPassword(""); }}>
                    Cancelar
                  </button>
                </div>
              </form>
              <button type="button" className="text-[11px] text-purple-300 hover:underline" onClick={scrollToChangePassword}>
                ¿No conoces tu contraseña? Defínela más arriba, en &ldquo;Change password?&rdquo;
              </button>
            </div>
          )}

          {setupStep === "password-disable" && (
            <div className="bg-gf-surface rounded-2xl p-3 flex flex-col items-center gap-3">
              <p className="text-xs text-gf-text-muted text-center">
                Confirma tu contraseña para desactivar la verificación en dos pasos.
              </p>
              <form onSubmit={handleDisable} className="form-trans-edit w-full flex flex-col gap-2 items-center">
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 w-full">
                  <button type="submit" disabled={isLoading} className="gf-glass-button-danger text-white text-xs rounded-full px-4 py-2 grow">
                    {isLoading ? <Spin /> : "Desactivar"}
                  </button>
                  <button type="button" className="text-[11px] text-gf-text-muted underline" onClick={() => { setSetupStep(null); setPassword(""); }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {setupStep === "scan" && totpSetup && (
            <div className="bg-gf-surface rounded-2xl p-3 flex flex-col items-center gap-3">
              <p className="text-xs text-gf-text-muted text-center">Escanea este código con tu app autenticadora.</p>
              {qrDataUrl && (
                <div className="bg-white p-2 rounded-2xl">
                  <Image src={qrDataUrl} alt="Código QR para configurar TOTP" width={260} height={260} />
                </div>
              )}
              <form onSubmit={handleConfirmSetup} className="form-trans-edit w-full flex flex-col gap-2 items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Código de 6 dígitos"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <button type="submit" className="gf-glass-button text-white text-xs rounded-full px-4 py-2">
                  {isLoading ? <Spin /> : "Confirmar"}
                </button>
              </form>
            </div>
          )}

          {setupStep === "confirm-done" && totpSetup && (
            <div className="bg-gf-surface border-2 border-purple-400 rounded-2xl p-3">
              <p className="text-xs font-semibold text-purple-300 mb-1">Guarda estos códigos de respaldo - no se mostrarán de nuevo:</p>
              <div className="grid grid-cols-2 gap-2">
                {totpSetup.backupCodes.map((backupCode) => (
                  <code key={backupCode} className="text-xs bg-gf-accent-soft-bg rounded-xl px-2 py-2 text-center break-all">
                    {backupCode}
                  </code>
                ))}
              </div>
              <div className="flex gap-2 justify-center mt-3">
                <button
                  type="button"
                  className="shrink-0 gf-glass-button text-white text-xs rounded-full px-3 py-2"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSetup.backupCodes.join("\n"));
                    runNotify("ok", "Copiados al portapapeles 🤓");
                  }}
                >
                  Copiar
                </button>
                <button
                  type="button"
                  className="shrink-0 gf-glass-button text-white text-xs rounded-full px-3 py-2"
                  onClick={() => downloadBackupCodes(totpSetup.backupCodes)}
                >
                  Descargar
                </button>
              </div>
              <button type="button" className="text-[11px] text-gf-text-muted underline mt-2 ml-3" onClick={() => { setSetupStep(null); setTotpSetup(null); }}>
                Listo, ocultar
              </button>
            </div>
          )}

          {twoFactorEnabled && (!setupStep || setupStep === "password-regenerate") && (
            <div className="mt-3">
              {newBackupCodes ? (
                <div className="bg-gf-surface border-2 border-purple-400 rounded-2xl p-3">
                  <p className="text-xs font-semibold text-purple-300 mb-1">
                    Copia estos códigos ahora - los anteriores ya no funcionan:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {newBackupCodes.map((backupCode) => (
                      <code key={backupCode} className="text-xs bg-gf-accent-soft-bg rounded-xl px-2 py-2 text-center break-all">
                        {backupCode}
                      </code>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-center mt-3">
                    <button
                      type="button"
                      className="shrink-0 gf-glass-button text-white text-xs rounded-full px-3 py-2"
                      onClick={() => {
                        navigator.clipboard.writeText(newBackupCodes.join("\n"));
                        runNotify("ok", "Copiados al portapapeles 🤓");
                      }}
                    >
                      Copiar
                    </button>
                    <button
                      type="button"
                      className="shrink-0 gf-glass-button text-white text-xs rounded-full px-3 py-2"
                      onClick={() => downloadBackupCodes(newBackupCodes)}
                    >
                      Descargar
                    </button>
                  </div>
                  <button type="button" className="text-[11px] text-gf-text-muted underline mt-2 ml-3" onClick={() => setNewBackupCodes(null)}>
                    Listo, ocultar
                  </button>
                </div>
              ) : setupStep === "password-regenerate" ? (
                <div className="bg-gf-surface rounded-2xl p-3 flex flex-col items-center gap-3">
                  <p className="text-xs text-gf-text-muted text-center">Confirma tu contraseña para regenerar tus códigos de respaldo.</p>
                  <form onSubmit={handleRegenerateBackupCodes} className="form-trans-edit w-full flex flex-col gap-2 items-center">
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2 w-full">
                      <button type="submit" disabled={isLoading} className="gf-glass-button text-white text-xs rounded-full px-4 py-2 grow">
                        {isLoading ? <Spin /> : "Continuar"}
                      </button>
                      <button type="button" className="text-[11px] text-gf-text-muted underline" onClick={() => { setSetupStep(null); setPassword(""); }}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  className="gf-glass-button text-white text-xs rounded-full px-4 py-2"
                  onClick={() => handleRegenerateBackupCodesSecurely()}
                >
                  {isLoading ? <Spin /> : "Regenerar códigos de respaldo"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TwoFactorPanel;
