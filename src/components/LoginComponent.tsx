"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaKey } from "react-icons/fa";
import { authClient } from "@/lib/auth/authClient";
import { signInWithPasskeyOnce } from "@/lib/auth/passkeyCeremony";
import Link from "next/link";
import runNotify from "@/helpers/gastifyNotifier";
import useHydrated from "@/hooks/useHydrated";
import { useT } from "@/i18n/client";


const MAX_TWO_FACTOR_ATTEMPTS = 3;

interface LoginFormState {
  mail: string;
  password: string;
}

function LoginComponent(): React.JSX.Element {
  const t = useT();
  const [formData, setFormData] = useState<LoginFormState>({
    mail: "",
    password: "",
  });
  const [errorForm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // Password login's own inline 2FA step - Better Auth's twoFactor plugin
  // gates /sign-in/email natively (its one stable, never-reverted sign-in
  // gating path - see the plan's Context section), so a password user with
  // TOTP already enabled gets a `{twoFactorRedirect: true}` response here
  // instead of a session. Handled as a small step within this same card
  // (no page navigation) rather than sending them to /verify-2fa, so they
  // aren't asked twice in a row.
  const [pendingTwoFactor, setPendingTwoFactor] = useState<boolean>(false);
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");
  const [twoFactorAttempts, setTwoFactorAttempts] = useState<number>(0);

  const router = useRouter();
  const hydrated = useHydrated();
  const searchParamas = useSearchParams();
  const email = searchParamas ? searchParamas.get("mail") : null;

  // The server already stamped the step-up on the session when it verified
  // the passkey / TOTP code (betterAuth.ts hooks.after), so just navigate.
  async function markStepUpVerifiedAndGo(): Promise<void> {
    router.push("/dashboard");
  }

  // React StrictMode (dev) runs effects twice; the ref keeps the notices to one.
  const noticesShown = useRef<boolean>(false);
  useEffect(() => {
    if (noticesShown.current) return;
    noticesShown.current = true;
    if (email) {
      runNotify("ok", t("errors.api.created", { p1: email }));
    }
    if (searchParamas && searchParamas.get("securityCheckFailed")) {
      runNotify("error", t("auth.error.identityNotVerified"));
    }
  }, []);

  //Loader
  useEffect(() => {
    import("ldrs").then(({ quantum }) => quantum.register());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const googleSignIn = async (): Promise<void> => {
    try {
      setLoading(true);
      // Straight to /verify-2fa, not /dashboard - dashboard/layout.js would
      // just redirect here anyway on its own stale-step-up check, so
      // pointing the OAuth callback here directly skips that whole extra
      // server round trip and gets the passkey prompt on screen sooner.
      await authClient.signIn.social({ provider: "google", callbackURL: "/verify-2fa" });
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };
  const passkeySignIn = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await signInWithPasskeyOnce();
      if (error) {
        runNotify("error", error.message || t("auth.could.not.sign.in.with.that.passkey"));
        setLoading(false);
        return;
      }
      // A passkey login already proves biometric possession - that's the
      // same proof /verify-2fa would otherwise ask for, so mark it done
      // right here instead of sending them there redundantly.
      await markStepUpVerifiedAndGo();
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    try {
      e.preventDefault();
      setLoading(true);
      // AUTH
      const { data, error } = await authClient.signIn.email({
        email: formData.mail,
        password: formData.password,
      });
      if (error) {
        console.log(error);
        runNotify(
          "error",
          error.message || t("auth.something.went.wrong.please.verify.your.username.or.try")
        );
        setLoading(false);
        return;
      }
      if ((data as { twoFactorRedirect?: boolean } | null | undefined)?.twoFactorRedirect) {
        // This account already has TOTP enabled - stay on this same card
        // and ask for the code inline instead of navigating away.
        setPendingTwoFactor(true);
        setLoading(false);
        return;
      }
      // Same shortcut as the Google path above: go straight to /verify-2fa
      // (it starts onboarding if this account has no second factor yet, or
      // bounces on to /dashboard itself if one's already been proven fresh)
      // instead of routing through /dashboard's own redundant redirect.
      router.push("/verify-2fa");
    } catch (e) {
      console.log(e);
      setLoading(false);
      throw new Error(e);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await authClient.twoFactor.verifyTotp({ code: twoFactorCode });
      if (error) {
        const nextAttempts = twoFactorAttempts + 1;
        setTwoFactorAttempts(nextAttempts);
        setTwoFactorCode("");
        if (nextAttempts >= MAX_TWO_FACTOR_ATTEMPTS) {
          runNotify("error", t("auth.error.codeAttemptsExceeded"));
          setPendingTwoFactor(false);
          setLoading(false);
          return;
        }
        runNotify("error", error.message || t("auth.incorrect.code.you.have.p1.attempt.s.left", { p1: MAX_TWO_FACTOR_ATTEMPTS - nextAttempts }));
        setLoading(false);
        return;
      }
      await markStepUpVerifiedAndGo();
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };
  return (
    <div className="login-componnt-cont flex flex-col w-[95%] h-[95%] sm:w-[550px] sm:h-[650px] relative rounded-2xl items-center justify-center sm:pt[20px] overflow-y-auto">
      <div className="loader">
        {!loading ? (
          ""
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center gf-loading-overlay z-50 absolute top-0 left-0 rounded-2xl text-center p-4 gap-4">
            <l-quantum size="150" speed="3.1" color="purple"></l-quantum>
            <p className=" text-xl text-purple-200">
              {t("auth.setup.working")}
            </p>
            <p className=" text-xl text-purple-200">{t("auth.setup.wait")}</p>
          </div>
        )}
      </div>
      <div className="pb-4 pt-10">
        <h1 className="text-center text-white text-2xl font-normal">
          {pendingTwoFactor ? t("auth.enter.your.verification.code") : t("auth.log.in.to.use.gastify")}
        </h1>
      </div>
      {email && !pendingTwoFactor && (
        // A toast alone (see the useEffect below) disappears in a few
        // seconds and can go unnoticed right after the visual jump from
        // /register to here - someone who registered, then landed on what
        // just looks like the same login screen again, could easily read
        // that as "it didn't work." A banner that stays on screen until
        // they actually log in makes the redirect read as the deliberate
        // next step it is, not a failure.
        <div className="w-[85%] mx-auto mb-3 rounded-2xl border border-green-400/40 bg-green-500/10 text-green-200 text-sm text-center px-4 py-3">
          {t("auth.account.created")}
        </div>
      )}
      <div className="form-container w-full rounded-t-[100px] h-full m-auto">
        {pendingTwoFactor ? (
          <form
            className="form-login w-full h-full text-center flex flex-col gap-4 justify-start items-center pt-2 sm:pt-10"
            onSubmit={handleTwoFactorSubmit}
          >
            <p className="text-gf-text-muted text-sm w-[80%]">
              {t("auth.twoFactor.prompt")}
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder={t("auth.twoFactor.codeLabel")}
              value={twoFactorCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFactorCode(e.target.value)}
              className="form-control text-center"
              autoFocus
              required
            />
            <button type="submit" className="social-btn-lf gf-glass-button">
              {t("auth.verify")}
            </button>
            <button
              type="button"
              className="text-purple-300 text-xs hover:underline"
              onClick={() => {
                setPendingTwoFactor(false);
                setTwoFactorCode("");
                setTwoFactorAttempts(0);
              }}
            >
              {t("auth.cancel")}
            </button>
          </form>
        ) : (
        <form
          className="form-login w-full h-full text-center flex flex-col gap-4 justify-start items-center pt-2 sm:pt-10"
          onSubmit={handleSubmit}
        >
          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="email" className="">
              {t("auth.email.label")}
            </label>
            <input
              name="mail"
              type="email"
              className=""
              id="mailForm"
              aria-describedby="maillHelp"
              placeholder="roberto.Gomez@gmail.com..."
              value={email ? (formData.mail = email) : formData.mail}
              onChange={handleChange}
              disabled={!hydrated}
              autoComplete="username webauthn"
              required
            />
            <div
              id="emailHelp"
              className="form-text-never w-[90%] font-light text-xs text-gf-text-muted"
            >
              {t("auth.email.privacy")}
            </div>
          </div>
          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="password" className="form-label">
              {t("auth.password.label")}
            </label>
            <input
              name="password"
              type="password"
              className="form-control"
              id="passwordForm"
              value={formData.password}
              onChange={handleChange}
              disabled={!hydrated}
            />
            {/* <div
                className={"tooltipPwass"}
                style={{ color: "red", fontSize: "8px", textAlign: "center" }}
              >
                <p className={validationMessages.passLength}>
                  The password must have at least 8 characters.
                </p>
                <p className={validationMessages.passCapital}>
                  The password must have at least one capital letter.
                </p>
                <p className={validationMessages.passSpecial}>{passString}</p>
              </div> */}
            <div
              id="passwordHelp"
              className="form-text-never w-[90%] font-light text-xs text-gf-text-muted"
            >
              {t("auth.password.privacy")}
            </div>
          </div>
          {errorForm && (
            <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
              {errorForm}
            </div>
          )}
          <button type="submit" className="social-btn-lf gf-glass-button" disabled={!hydrated}>
            {t("auth.submit")}
          </button>
          <div className="divider border-t-2 border-gf-border w-[70%] mt-5"></div>
          <div className="bts-fast w-[100%] pt-5  flex flex-col gap-8 justify-center items-center">
            <div className="social-btn-lf gf-glass-button" onClick={googleSignIn}>
              <div className="sblf-icon-cont">
                <FcGoogle size={25} />
              </div>
              <p>{t("auth.google")} </p>
            </div>
            <div className="social-btn-lf gf-glass-button" onClick={passkeySignIn}>
              <div className="sblf-icon-cont">
                <FaKey size={22} />
              </div>
              <p>{t("auth.passkey.signIn")}</p>
            </div>
            <div className="text-purple-300 w-[90%] text-xs hover:underline">
              <Link href="/register">
                <p className="">{t("auth.noAccount")}</p>
              </Link>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default LoginComponent;
