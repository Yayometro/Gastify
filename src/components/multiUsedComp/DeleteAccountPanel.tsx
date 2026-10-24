"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { authClient } from "@/lib/auth/authClient";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { redirectIfStepUpRequired } from "@/lib/auth/stepUpRedirect";
import { useT } from "@/i18n/client";

interface AuthSession {
  user?: { email?: string; twoFactorEnabled?: boolean };
}

interface RemoveUserApiResponse {
  ok: boolean;
  message?: string;
  attemptsLeft?: number;
  retryAfterMinutes?: number;
  code?: string;
}

// "Eliminar mi cuenta" - irreversible, so the server asks for a fresh code from
// the authenticator app (or a backup code) plus the account email typed again
// (see general-data/user/remove-user). With the authenticator app (TOTP) that is a
// code typed here; an account with only passkeys has no code to type, so it just
// retypes the email and the server requires a passkey verification from the last
// few minutes (if it is stale, the user is sent to /verify-2fa and comes back).
function DeleteAccountPanel(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { data: rawSession } = authClient.useSession();
  const session = rawSession as AuthSession | null | undefined;
  const twoFactorEnabled = Boolean(session?.user?.twoFactorEnabled);
  const { data: passkeys } = authClient.useListPasskeys();
  const passkeyOnly = !twoFactorEnabled && Boolean(passkeys && passkeys.length > 0);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [confirmMail, setConfirmMail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [useBackupCode, setUseBackupCode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  function close(): void {
    setIsOpen(false);
    setConfirmMail("");
    setCode("");
    setUseBackupCode(false);
    setErrorMessage("");
  }

  async function handleDelete(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setErrorMessage("");
    // A typo in the email must not cost a fingerprint prompt.
    if (confirmMail.trim().toLowerCase() !== String(session?.user?.email || "").toLowerCase()) {
      setErrorMessage("El correo escrito no coincide con el de tu cuenta.");
      return;
    }
    try {
      setIsLoading(true);
      if (passkeyOnly) {
        // The proof is asked for right here, in the same step, instead of
        // bouncing the user to /verify-2fa and back (the server stamps the
        // session once the passkey is verified; remove-user checks that stamp).
        const { error } = await authClient.signIn.passkey();
        if (error) {
          const cancelled = (error as { code?: string }).code === "AUTH_CANCELLED" || /cancel/i.test(error.message || "");
          setErrorMessage(
            cancelled
              ? "Cerraste el cuadro del passkey. Vuelve a intentarlo cuando quieras confirmar."
              : error.message || "No se pudo verificar tu passkey."
          );
          setIsLoading(false);
          return;
        }
      }
      const res = await fetcher().post<RemoveUserApiResponse>("general-data/user/remove-user", {
        code,
        method: useBackupCode ? "backup" : "totp",
        confirmMail,
      });
      if (!res.ok) {
        if (redirectIfStepUpRequired({ code: res.code }, t("auth.stepUp"))) return;
        const extra =
          typeof res.attemptsLeft === "number"
            ? ` Te quedan ${res.attemptsLeft} intento(s).`
            : res.retryAfterMinutes
              ? ` Intenta de nuevo en ${res.retryAfterMinutes} min.`
              : "";
        setErrorMessage((res.message || "No se pudo eliminar la cuenta.") + extra);
        setCode("");
        setIsLoading(false);
        return;
      }
      runNotify("ok", t("accounts.delete.done"));
      try {
        await (authClient.signOut as unknown as () => Promise<unknown>)();
      } catch {
        // The session was already deleted server-side; signing out only clears the cookie.
      }
      router.push("/");
    } catch (err) {
      console.log(err);
      setErrorMessage("Algo salió mal al eliminar la cuenta. Intenta de nuevo.");
      setIsLoading(false);
    }
  }

  return (
    <div className="remove-account-prof w-full pt-8 pb-[100px] flex flex-col items-center gap-3">
      {!isOpen ? (
        <button
          type="button"
          className="remove-acc gf-glass-button-danger text-white text-sm font-medium rounded-full px-6 py-2"
          onClick={() => setIsOpen(true)}
        >
          {t("accounts.delete.button")}
        </button>
      ) : (
        <div className="w-full max-w-[520px] bg-gf-surface rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-red-400">{t("accounts.delete.button")}</p>
          <p className="text-xs text-gf-text-muted">
            {t("accounts.delete.warning")}
          </p>
          {!twoFactorEnabled && !passkeyOnly ? (
            <>
              <p className="text-xs text-gf-text">
                {t("accounts.delete.needFactor")}
              </p>
              <button type="button" className="text-purple-300 text-xs hover:underline self-start" onClick={close}>
                {t("accounts.close")}
              </button>
            </>
          ) : (
            <form onSubmit={handleDelete} className="form-trans-edit w-full flex flex-col gap-2">
              <label className="text-xs text-gf-text-muted" htmlFor="gf-delete-mail">
                {t("accounts.delete.confirmMail", { p1: session?.user?.email })}
              </label>
              <input
                id="gf-delete-mail"
                type="email"
                autoComplete="off"
                value={confirmMail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmMail(e.target.value)}
                required
              />
              {twoFactorEnabled ? (
                <>
                  <label className="text-xs text-gf-text-muted" htmlFor="gf-delete-code">
                    {useBackupCode ? "Un código de respaldo" : "Código de 6 dígitos de tu app autenticadora"}
                  </label>
                  <input
                    id="gf-delete-code"
                    type="text"
                    inputMode={useBackupCode ? "text" : "numeric"}
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="text-purple-300 text-xs hover:underline self-start"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setCode("");
                    }}
                  >
                    {useBackupCode ? "Usar el código de mi app autenticadora" : "Usar un código de respaldo"}
                  </button>
                </>
              ) : (
                <p className="text-xs text-gf-text">
                  {t("accounts.delete.passkeyNote")}
                </p>
              )}
              {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  disabled={isLoading}
                  className="gf-glass-button text-white text-xs rounded-full px-4 py-2"
                  onClick={close}
                >
                  {t("accounts.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !confirmMail || (twoFactorEnabled && !code)}
                  className="gf-glass-button-danger text-white text-xs rounded-full px-4 py-2"
                >
                  {isLoading ? <Spin /> : "Eliminar definitivamente"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default DeleteAccountPanel;
