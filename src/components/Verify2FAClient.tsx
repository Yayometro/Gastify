"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import QRCode from "qrcode";
import { authClient } from "@/lib/auth/authClient";
import runNotify from "@/helpers/gastifyNotifier";
import downloadBackupCodes from "@/helpers/downloadBackupCodes";
import { FACTOR_CHANGE_STEP_UP_TTL_MINUTES, STEP_UP_TTL_MINUTES } from "@/lib/auth/stepUpConfig";
import { store } from "@/lib/store";
import { fetchUser } from "@/lib/features/userSlice";
import { fetchWallet } from "@/lib/features/walletSlice";
import { fetchAccounts } from "@/lib/features/accountsSlice";
import { fetchCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat } from "@/lib/features/subCategorySlice";
import { fetchTrans } from "@/lib/features/transacctionsSlice";
import { fetchBudget } from "@/lib/features/budgetSlice";

const MAX_ATTEMPTS = 3;

// Loop-detection circuit breaker. Reported live: browser back/forward and
// direct URL navigation while mid-verification can land back on this same
// page repeatedly (dashboard/layout.js keeps bouncing here on every fresh
// request whose step-up isn't fresh) - each fresh mount re-auto-triggers
// the passkey ceremony, so a user stuck in that loop would just keep
// getting asked for their fingerprint with no way out. Rather than chase
// every possible cause of a bounce, this counts mounts of THIS tab within a
// short window (sessionStorage - survives full navigations/reloads in this
// tab, but never leaks into a fresh tab) and, past a small tolerance for a
// single legitimate extra hop, signs out cleanly instead of continuing to
// loop.
const LOOP_GUARD_KEY = "gf_verify2fa_loop_guard";
const LOOP_GUARD_WINDOW_MS = 20000;
const LOOP_GUARD_MAX_MOUNTS = 4;

function clearLoopGuard(): void {
  try {
    sessionStorage.removeItem(LOOP_GUARD_KEY);
  } catch {
    // sessionStorage unavailable (private mode, etc.) - nothing to clear
  }
}

// Returns true if this mount pushed the count past the loop threshold.
function registerLoopGuardMount(): boolean {
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(LOOP_GUARD_KEY);
    const timestamps: number[] = (raw ? JSON.parse(raw) : []).filter(
      (t: number) => now - t < LOOP_GUARD_WINDOW_MS
    );
    timestamps.push(now);
    sessionStorage.setItem(LOOP_GUARD_KEY, JSON.stringify(timestamps));
    return timestamps.length > LOOP_GUARD_MAX_MOUNTS;
  } catch {
    return false;
  }
}

type Phase =
  | "loading"
  | "onboard-choose"
  | "onboard-totp-scan-pending"
  | "onboard-totp-password"
  | "onboard-totp-scan"
  | "onboard-backup-reveal"
  | "challenge"
  | "challenge-totp"
  | "challenge-backup";

interface TotpSetupData {
  totpURI: string;
  backupCodes: string[];
}

interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
  twoFactorEnabled?: boolean;
}

interface AuthSession {
  user?: AuthUser;
  session?: unknown;
}

type AppDispatch = typeof store.dispatch;
// Unmigrated JS Redux thunk action creators infer ThunkArg as void; typed helper for dispatching with email parameter
type ThunkWithEmail = (email: string) => Parameters<AppDispatch>[0];

// The single screen every sign-in method funnels through when the current
// session hasn't proven a step-up check (passkey/TOTP/backup code) within
// the freshness window - see dashboard/layout.js and
// src/lib/auth/stepUpConfig.js. Two modes, chosen automatically from
// whether this account already has a second factor registered:
// - "onboard": first time ever (every existing user today) - register a
//   passkey or set up an authenticator app right here.
// - "challenge": already configured - prove it again, passkey first,
//   TOTP/backup code as a fallback. 3 failed attempts signs out. The
//   passkey ceremony fires automatically the moment this mode is reached
//   (no click needed first) - the fingerprint/Face ID/PIN prompt itself IS
//   the security gate, an extra click in front of it doesn't add anything.
export interface Verify2FAClientProps {
  // Where to go once verified (set when a profile factor change asked for it).
  nextPath?: string | null;
  // True when a factor change (profile) sent the user here: the proof is
  // asked for more often than for the dashboard, and the copy says so.
  reauth?: boolean;
}

function Verify2FAClient({ nextPath, reauth = false }: Verify2FAClientProps = {}): React.JSX.Element {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { data: rawSession, isPending: sessionPending } = authClient.useSession();
  const session = rawSession as unknown as AuthSession | null;
  const { data: passkeys, isPending: passkeysPending } = authClient.useListPasskeys();

  const [phase, setPhase] = useState<Phase>("loading");
  const [loading, setLoading] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [totpSetup, setTotpSetup] = useState<TotpSetupData | null>(null); // { totpURI, backupCodes }
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loopBroken, setLoopBroken] = useState<boolean>(false);
  const [passkeyNotice, setPasskeyNotice] = useState<string>("");
  const autoTriggered = useRef<boolean>(false);
  const prefetchTriggered = useRef<boolean>(false);

  useEffect(() => {
    import("ldrs").then(({ quantum }) => quantum.register());
  }, []);

  // See LOOP_GUARD_* above - runs once per mount, before anything else gets
  // a chance to auto-fire a passkey ceremony.
  useEffect(() => {
    if (registerLoopGuardMount()) {
      setLoopBroken(true);
      clearLoopGuard();
      (authClient.signOut as unknown as () => Promise<unknown>)().finally(() => {
        router.push("/login?securityCheckFailed=1");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determines the STARTING phase exactly once. Found live: without the
  // phaseDetermined guard, this effect re-runs on every subsequent
  // session/passkeys refetch too (e.g. right after twoFactor.enable()
  // succeeds mid-onboarding) and was clobbering whatever phase the explicit
  // step handlers below had just navigated to, bouncing the user back to
  // onboard-choose/challenge in the middle of a flow. Every phase change
  // after the first is owned entirely by those handlers now.
  const phaseDetermined = useRef<boolean>(false);
  useEffect(() => {
    if (loopBroken || sessionPending || passkeysPending || phaseDetermined.current) return;
    phaseDetermined.current = true;
    const hasPasskey = Boolean(passkeys && passkeys.length > 0);
    const hasTotp = Boolean(session?.user?.twoFactorEnabled);
    // An account with only the authenticator app has no passkey to ask for: the
    // OS passkey dialog used to open anyway and a cancel cost an attempt (bug 159).
    setPhase(hasPasskey ? "challenge" : hasTotp ? "challenge-totp" : "onboard-choose");
  }, [loopBroken, sessionPending, passkeysPending, passkeys, session]);

  // Warms up the Wallet's own Redux data while the user is still proving
  // their identity here (typing a code, or - usually - the second or two a
  // passkey ceremony takes) - the exact same thunks
  // useFetchAndGetAllReduxInfo dispatches once actually on /dashboard, just
  // started earlier. Uses this user's own already-valid session email (not
  // yet a fully step-up-verified one, but this data isn't gated behind
  // that - only the Wallet UI itself is), so by the time verification
  // succeeds and /dashboard mounts, its own `status === "idle"` guards see
  // these as already in flight or done and skip re-fetching - the page
  // reads as instant instead of loading a second time. If verification
  // never completes, this prefetch simply goes unused.
  useEffect(() => {
    const email = session?.user?.email;
    if (!email || prefetchTriggered.current) return;
    prefetchTriggered.current = true;
    dispatch((fetchUser as unknown as ThunkWithEmail)(email));
    dispatch((fetchWallet as unknown as ThunkWithEmail)(email));
    dispatch((fetchAccounts as unknown as ThunkWithEmail)(email));
    dispatch((fetchCategories as unknown as ThunkWithEmail)(email));
    dispatch((fetchSubCat as unknown as ThunkWithEmail)(email));
    dispatch((fetchTrans as unknown as ThunkWithEmail)(email));
    dispatch((fetchBudget as unknown as ThunkWithEmail)(email));
  }, [session, dispatch]);

  async function finishStepUp(): Promise<void> {
    setRedirecting(true);
    clearLoopGuard();
    // The server stamps the step-up on the session inside the very request
    // that verified the passkey / TOTP / backup code (betterAuth.ts
    // hooks.after), so by the time we get here the stamp is already written -
    // there is no separate write to await, and so no race with the
    // /dashboard SSR check (the old client-side write was observed to spiral
    // into "Maximum update depth exceeded" when not awaited).
    router.push(nextPath || "/dashboard");
  }

  async function failAttempt(message?: string): Promise<void> {
    const next = attempts + 1;
    setAttempts(next);
    if (next >= MAX_ATTEMPTS) {
      runNotify("error", "No pudimos verificar tu identidad después de 3 intentos. Por seguridad cerramos tu sesión.");
      clearLoopGuard();
      await (authClient.signOut as unknown as () => Promise<unknown>)();
      router.push("/login?securityCheckFailed=1");
      return;
    }
    runNotify("error", message || `Código incorrecto. Te quedan ${MAX_ATTEMPTS - next} intento(s).`);
  }

  // --- Onboarding: register a passkey right here ---
  async function handleOnboardPasskey(): Promise<void> {
    try {
      setLoading(true);
      const { error } = await authClient.passkey.addPasskey({ name: "Passkey principal" });
      if (error) {
        runNotify("error", error.message || "No se pudo registrar el passkey 🤕");
        return;
      }
      runNotify("ok", "Passkey registrado 🤓");
      await finishStepUp();
    } finally {
      setLoading(false);
    }
  }

  // --- Onboarding: set up TOTP ---
  // Whether this account needs a password to confirm can't be known ahead
  // of time from the client (Better Auth's own /list-accounts reports that
  // a "credential" account exists but never whether it actually still has a
  // password - an account can be password-less, e.g. right after clearing
  // one) - so every attempt is optimistic, fired with no password first,
  // and only asks for one on an actual INVALID_PASSWORD response.
  function startOnboardTotp(): void {
    setPhase("onboard-totp-scan-pending");
  }

  async function handleOnboardTotpStart(e?: React.FormEvent<HTMLFormElement>): Promise<void> {
    e?.preventDefault?.();
    // Reads the form's own current value rather than trusting the
    // React-controlled `password` state alone - found live in
    // TwoFactorPanel.jsx (same pattern here): a pasted or browser-autofilled
    // password can land in the visible input without React's onChange ever
    // firing, so the request silently went out with no password at all and
    // came back "Contraseña incorrecta" for a password that was actually
    // correct.
    const form = e?.target as HTMLFormElement | undefined;
    const passwordInput = form?.elements?.namedItem("password") as HTMLInputElement | null | undefined;
    const currentPassword = passwordInput?.value || password;
    try {
      setLoading(true);
      const { data, error } = await authClient.twoFactor.enable({ method: "totp", password: currentPassword || undefined });
      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          // A password-less first attempt landing here just means the
          // account has one on file - nothing "incorrect" happened yet, so
          // only a real wrong-password retry gets a toast.
          if (currentPassword) runNotify("error", "Contraseña incorrecta 🤕");
        } else {
          runNotify("error", error.message || "No se pudo iniciar la configuración 🤕");
        }
        setPhase("onboard-totp-password");
        return;
      }
      setPassword("");
      const setupData = data as unknown as TotpSetupData;
      setTotpSetup(setupData);
      const dataUrl = await QRCode.toDataURL(setupData.totpURI);
      setQrDataUrl(dataUrl);
      setPhase("onboard-totp-scan");
    } finally {
      setLoading(false);
    }
  }

  // The very first attempt (no password) fires the instant this phase is
  // reached, giving the UI somewhere to show a spinner between the click
  // and either the QR screen or the password prompt.
  useEffect(() => {
    if (phase === "onboard-totp-scan-pending") handleOnboardTotpStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleOnboardTotpConfirm(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        runNotify("error", error.message || "Código incorrecto, intenta de nuevo 🤕");
        return;
      }
      setPhase("onboard-backup-reveal");
    } finally {
      setLoading(false);
    }
  }

  // --- Challenge (already has a second factor) ---
  async function handleChallengePasskey(): Promise<void> {
    try {
      setLoading(true);
      setPasskeyNotice("");
      const { error } = await authClient.signIn.passkey();
      if (error) {
        // Closing the system dialog (Esc / Cancel) is not a failed guess: no
        // attempt is spent, the user is told what happened and can retry or use a code.
        if ((error as { code?: string }).code === "AUTH_CANCELLED" || /cancel/i.test(error.message || "")) {
          setPasskeyNotice(
            hasTotp
              ? "Cerraste el cuadro del passkey. Puedes intentarlo de nuevo o usar un código de tu app autenticadora."
              : "Cerraste el cuadro del passkey. Puedes intentarlo de nuevo."
          );
          return;
        }
        await failAttempt(error.message);
        return;
      }
      await finishStepUp();
    } finally {
      setLoading(false);
    }
  }

  // Fires the passkey ceremony the instant we know this account already has
  // one - no click needed first. Only the very first attempt auto-fires;
  // if the user cancels the OS prompt or it fails, they fall back to the
  // manual button (an auto-retry loop would be its own kind of annoying).
  useEffect(() => {
    if (phase === "challenge" && !autoTriggered.current) {
      autoTriggered.current = true;
      handleChallengePasskey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleChallengeTotp(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        await failAttempt();
        setCode("");
        return;
      }
      await finishStepUp();
    } finally {
      setLoading(false);
    }
  }

  async function handleChallengeBackupCode(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await authClient.twoFactor.verifyBackupCode({ code });
      if (error) {
        await failAttempt();
        setCode("");
        return;
      }
      await finishStepUp();
    } finally {
      setLoading(false);
    }
  }

  const hasTotp = Boolean(session?.user?.twoFactorEnabled);
  const cardClasses = "verify-2fa-cont gf-glass-card flex flex-col w-[95%] sm:w-[550px] relative rounded-[40px] items-center justify-center p-6 sm:p-10 gap-4";

  if (loopBroken) {
    return (
      <div className={cardClasses}>
        <l-quantum size="120" speed="3.1" color="purple"></l-quantum>
        <p className="text-lg text-purple-200 text-center">
          Por seguridad, cerramos tu sesión. Inicia sesión de nuevo para continuar…
        </p>
      </div>
    );
  }

  if (phase === "loading" || phase === "onboard-totp-scan-pending" || redirecting) {
    return (
      <div className={cardClasses}>
        <l-quantum size="120" speed="3.1" color="purple"></l-quantum>
        <p className="text-lg text-purple-200 text-center">
          {redirecting ? "¡Listo! Llevándote a tu Wallet…" : "Verificando tu identidad…"}
        </p>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      {phase === "onboard-choose" && (
        <>
          <h1 className="text-white text-2xl font-normal text-center">Estamos añadiendo una capa extra de seguridad a tu cuenta</h1>
          <p className="text-gf-text-muted text-sm text-center">
            A partir de ahora, cada vez que inicies sesión (o después de un rato sin actividad) te pediremos confirmar
            tu identidad. Elige cómo prefieres hacerlo:
          </p>
          <button type="button" disabled={loading} onClick={handleOnboardPasskey} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
            Registrar huella / Face ID (passkey)
          </button>
          <button type="button" disabled={loading} onClick={startOnboardTotp} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
            Usar una app autenticadora (Google/Microsoft Authenticator)
          </button>
        </>
      )}

      {phase === "onboard-totp-password" && (
        <>
          <h1 className="text-white text-2xl font-normal text-center">Confirma tu contraseña</h1>
          <p className="text-gf-text-muted text-sm text-center">
            Tu cuenta tiene una contraseña configurada - confírmala para activar la app autenticadora.
          </p>
          <form onSubmit={handleOnboardTotpStart} className="form-trans-edit w-full flex flex-col gap-2 items-center">
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" disabled={loading} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
              Continuar
            </button>
          </form>
          {/* Only escape hatch here that doesn't need the password:
              passkeys don't need one at all, so someone who genuinely
              doesn't know it (every migrated account has one on file,
              used or not) isn't stuck with no way forward. */}
          <button type="button" className="text-purple-300 text-xs hover:underline" onClick={() => { setPassword(""); setPhase("onboard-choose"); }}>
            ¿No conoces tu contraseña? Registra tu huella / Face ID en su lugar
          </button>
          <button type="button" className="text-purple-300 text-xs hover:underline" onClick={() => { setPhase("onboard-choose"); setPassword(""); }}>
            Cancelar
          </button>
        </>
      )}

      {phase === "onboard-totp-scan" && totpSetup && (
        <>
          <h1 className="text-white text-2xl font-normal text-center">Escanea este código</h1>
          <p className="text-gf-text-muted text-sm text-center">
            Ábrelo con Google Authenticator, Microsoft Authenticator, o la app que prefieras.
          </p>
          {qrDataUrl && (
            <div className="bg-white p-3 rounded-2xl">
              <Image src={qrDataUrl} alt="Código QR para configurar TOTP" width={260} height={260} />
            </div>
          )}
          <form onSubmit={handleOnboardTotpConfirm} className="form-trans-edit w-full flex flex-col gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              className="form-control text-center"
              required
            />
            <button type="submit" disabled={loading} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
              Confirmar
            </button>
          </form>
        </>
      )}

      {phase === "onboard-backup-reveal" && totpSetup && (
        <>
          <h1 className="text-white text-2xl font-normal text-center">Guarda tus códigos de respaldo</h1>
          <p className="text-gf-text-muted text-sm text-center">
            Úsalos si alguna vez pierdes acceso a tu app autenticadora. Cada uno solo funciona una vez.
          </p>
          <div className="bg-gf-surface border-2 border-purple-400 rounded-2xl p-3 w-full">
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
                Copiar todos
              </button>
              <button
                type="button"
                className="shrink-0 gf-glass-button text-white text-xs rounded-full px-3 py-2"
                onClick={() => downloadBackupCodes(totpSetup.backupCodes)}
              >
                Descargar
              </button>
            </div>
          </div>
          <button type="button" disabled={loading} onClick={finishStepUp} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
            Ya los guardé, continuar
          </button>
        </>
      )}

      {phase === "challenge" && (
        <>
          <l-quantum size="80" speed="3.1" color="purple"></l-quantum>
          <h1 className="text-white text-2xl font-normal text-center">Verifica tu identidad</h1>
          <p className="text-gf-text-muted text-sm text-center">
            {reauth
              ? `Para cambiar tus factores de verificación (passkeys, app autenticadora o códigos de respaldo) te pedimos confirmar tu identidad cada ${FACTOR_CHANGE_STEP_UP_TTL_MINUTES} minutos. Pon tu huella, Face ID o código del dispositivo para continuar.`
              : `Han pasado más de ${STEP_UP_TTL_MINUTES} minutos, o iniciaste sesión de una forma que aún no comprobamos con tu segundo factor. Pon tu huella, Face ID o código del dispositivo para continuar.`}
          </p>
          {passkeyNotice && <p className="text-xs text-amber-300 text-center">{passkeyNotice}</p>}
          <button type="button" disabled={loading} onClick={handleChallengePasskey} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
            Verificar con mi passkey
          </button>
          {hasTotp && (
            <button type="button" className="text-purple-300 text-xs hover:underline" onClick={() => setPhase("challenge-totp")}>
              ¿No tienes tu dispositivo? Usa un código
            </button>
          )}
        </>
      )}

      {phase === "challenge-totp" && (
        <>
          <h1 className="text-white text-2xl font-normal text-center">Ingresa tu código</h1>
          <form onSubmit={handleChallengeTotp} className="form-trans-edit w-full flex flex-col gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código de tu app autenticadora"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              className="form-control text-center"
              required
            />
            <button type="submit" disabled={loading} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
              Verificar
            </button>
          </form>
          <button type="button" className="text-purple-300 text-xs hover:underline" onClick={() => setPhase("challenge-backup")}>
            Usar un código de respaldo en su lugar
          </button>
        </>
      )}

      {phase === "challenge-backup" && (
        <>
          <h1 className="text-white text-2xl font-normal text-center">Código de respaldo</h1>
          <form onSubmit={handleChallengeBackupCode} className="form-trans-edit w-full flex flex-col gap-2 items-center">
            <input
              type="text"
              placeholder="Código de respaldo"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              className="form-control text-center"
              required
            />
            <button type="submit" disabled={loading} className="gf-glass-button text-white rounded-full px-4 py-3 w-full">
              Verificar
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default Verify2FAClient;
