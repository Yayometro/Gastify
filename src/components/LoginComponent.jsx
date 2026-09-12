"use client";
import React, { useEffect } from "react";
import { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaKey } from "react-icons/fa";
import { authClient } from "@/lib/auth/authClient";
import Link from "next/link";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";

const MAX_TWO_FACTOR_ATTEMPTS = 3;

function LoginComponent() {
  const [formData, setFormData] = useState({
    mail: "",
    password: "",
  });
  const [errorForm, setErrorForm] = useState("");
  const [loading, setLoading] = useState(false);
  // Password login's own inline 2FA step - Better Auth's twoFactor plugin
  // gates /sign-in/email natively (its one stable, never-reverted sign-in
  // gating path - see the plan's Context section), so a password user with
  // TOTP already enabled gets a `{twoFactorRedirect: true}` response here
  // instead of a session. Handled as a small step within this same card
  // (no page navigation) rather than sending them to /verify-2fa, so they
  // aren't asked twice in a row.
  const [pendingTwoFactor, setPendingTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorAttempts, setTwoFactorAttempts] = useState(0);

  const router = useRouter();
  const searchParamas = useSearchParams();
  const email = searchParamas.get("mail");

  async function markStepUpVerifiedAndGo() {
    const toFetch = fetcher();
    await toFetch.post("auth-extra/mark-step-up", {});
    router.push("/dashboard");
  }

  useEffect(() => {
    if (email) {
      runNotify("ok", `${email} was created successfully 🤓`);
    }
    if (searchParamas.get("securityCheckFailed")) {
      runNotify("error", "No pudimos verificar tu identidad, así que cerramos tu sesión por seguridad. Inicia sesión de nuevo.");
    }
  }, []);

  //Loader
  useEffect(() => {
    import("ldrs").then(({ quantum }) => quantum.register());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const googleSignIn = async () => {
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
  const passkeySignIn = async () => {
    try {
      setLoading(true);
      const { error } = await authClient.signIn.passkey();
      if (error) {
        runNotify("error", error.message || "Could not sign in with that passkey 🤕");
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
  const handleSubmit = async (e) => {
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
          error.message || "Something went wrong, please verify your username or try again later 🤕"
        );
        setLoading(false);
        return;
      }
      if (data?.twoFactorRedirect) {
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

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await authClient.twoFactor.verifyTotp({ code: twoFactorCode });
      if (error) {
        const nextAttempts = twoFactorAttempts + 1;
        setTwoFactorAttempts(nextAttempts);
        setTwoFactorCode("");
        if (nextAttempts >= MAX_TWO_FACTOR_ATTEMPTS) {
          runNotify("error", "No pudimos verificar tu código después de 3 intentos. Intenta iniciar sesión de nuevo.");
          setPendingTwoFactor(false);
          setLoading(false);
          return;
        }
        runNotify("error", error.message || `Código incorrecto. Te quedan ${MAX_TWO_FACTOR_ATTEMPTS - nextAttempts} intento(s).`);
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
              We are working to set everything up for you
            </p>
            <p className=" text-xl text-purple-200">Please wait a moment 🤓</p>
          </div>
        )}
      </div>
      <div className="pb-4 pt-10">
        <h1 className="text-center text-white text-2xl font-normal">
          {pendingTwoFactor ? "Ingresa tu código de verificación" : "Login to use Gastify 💸"}
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
          ¡Tu cuenta se creó correctamente! Inicia sesión para continuar.
        </div>
      )}
      <div className="form-container w-full rounded-t-[100px] h-full m-auto">
        {pendingTwoFactor ? (
          <form
            className="form-login w-full h-full text-center flex flex-col gap-4 justify-start items-center pt-2 sm:pt-10"
            onSubmit={handleTwoFactorSubmit}
          >
            <p className="text-gf-text-muted text-sm w-[80%]">
              Esta cuenta tiene verificación en dos pasos activada. Ingresa el código de tu app autenticadora.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código de 6 dígitos"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="form-control text-center"
              autoFocus
              required
            />
            <button type="submit" className="social-btn-lf gf-glass-button">
              Verificar
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
              Cancelar
            </button>
          </form>
        ) : (
        <form
          className="form-login w-full h-full text-center flex flex-col gap-4 justify-start items-center pt-2 sm:pt-10"
          onSubmit={handleSubmit}
        >
          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="email" className="">
              Email address
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
              autoComplete="username webauthn"
              required
            />
            <div
              id="emailHelp"
              className="form-text-never w-[90%] font-light text-xs text-gf-text-muted"
            >
              We will never share your email with anyone else.
            </div>
          </div>
          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              name="password"
              type="password"
              className="form-control"
              id="passwordForm"
              value={formData.password}
              onChange={handleChange}
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
              We will never share your password with anyone else.
            </div>
          </div>
          {errorForm && (
            <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
              {errorForm}
            </div>
          )}
          <button type="submit" className="social-btn-lf gf-glass-button">
            Submit
          </button>
          <div className="divider border-t-2 border-gf-border w-[70%] mt-5"></div>
          <div className="bts-fast w-[100%] pt-5  flex flex-col gap-8 justify-center items-center">
            <div className="social-btn-lf gf-glass-button" onClick={googleSignIn}>
              <div className="sblf-icon-cont">
                <FcGoogle size={25} />
              </div>
              <p>Google </p>
            </div>
            <div className="social-btn-lf gf-glass-button" onClick={passkeySignIn}>
              <div className="sblf-icon-cont">
                <FaKey size={22} />
              </div>
              <p>Sign in with a passkey</p>
            </div>
            <div className="text-purple-300 w-[90%] text-xs hover:underline">
              <Link href="/register">
                <p className="">You do not have an account? - Click here</p>
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
