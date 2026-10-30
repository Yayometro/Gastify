"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import runNotify from "@/helpers/gastifyNotifier";
import { authClient } from "@/lib/auth/authClient";
import { updateUser } from "@/lib/features/userSlice";
import type { AppDispatch } from "@/lib/store";
import { useT } from "@/i18n/client";
import { validateEmailAddress, validateNewPassword } from "@gastify/core/profile/accessRules";
import TutorialTip from "@/components/tour/TutorialTip";
import { ProfileCard, ProfileField, PrimaryButton, errorMessage, saveAccount } from "./ProfileParts";

type OpenForm = "email" | "password" | null;

// How the person signs in: the e-mail and the password, changed the same way as on the phone. Changing the e-mail signs the
// person out, so they come back in with the new one.
export default function ProfileAccessCard({ email }: { email: string }) {
  const t = useT();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState<OpenForm>(null);
  const [newMail, setNewMail] = useState<string>("");
  const [mailError, setMailError] = useState<string | null>(null);
  const [mailBusy, setMailBusy] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState<boolean>(false);

  // The two-factor panel's "¿No conoces tu contraseña?" link asks for the password form here.
  useEffect(() => {
    const openPassword = () => {
      setOpen("password");
      setTimeout(() => {
        document.getElementById("gf-change-password-toggle")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    };
    window.addEventListener("gf:open-change-password", openPassword);
    return () => window.removeEventListener("gf:open-change-password", openPassword);
  }, []);

  const toggle = (form: Exclude<OpenForm, null>) => setOpen(open === form ? null : form);

  const changeEmail = async () => {
    const problemKey = validateEmailAddress(newMail, email);
    const problem = problemKey ? t(problemKey) : null;
    setMailError(problem);
    if (problem) return;
    if (!window.confirm(t("profile.access.mailHint", { p1: newMail.trim() }))) return;
    setMailBusy(true);
    try {
      const updated = await saveAccount({ mail: newMail.trim() });
      if (updated) dispatch(updateUser(updated));
      runNotify("ok", t("profile.access.mailChanged"));
      authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
    } catch (error) {
      setMailError(errorMessage(error));
    } finally {
      setMailBusy(false);
    }
  };

  const changePassword = async () => {
    const problem = validateNewPassword(password, confirm);
    setPasswordError(problem);
    if (problem) return;
    setPasswordBusy(true);
    try {
      await saveAccount({ password });
      runNotify("ok", t("profile.access.passwordChanged"));
      setPassword("");
      setConfirm("");
      setOpen(null);
    } catch (error) {
      setPasswordError(errorMessage(error));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <ProfileCard title={t("profile.access.title")} tour="prof-access" help={<><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="profAccess" label={t("profile.access.title")} /></>}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          data-tour="prof-access-mail"
          aria-expanded={open === "email"}
          onClick={() => toggle("email")}
          className="flex items-center justify-between gap-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-gf-text">{t("profile.access.changeMail")}</span>
            <span className="block truncate text-sm text-gf-text-muted">{email}</span>
          </span>
          <span className="shrink-0 rounded-full gf-glass-inset px-4 py-2 text-sm text-gf-text">
            {open === "email" ? t("profile.access.close") : t("profile.access.open")}
          </span>
        </button>
        {open === "email" && (
          <div className="flex flex-col gap-3">
            <ProfileField
              label={t("profile.access.newMail")}
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={newMail}
              onChange={(event) => setNewMail(event.target.value)}
            />
            {mailError && <p className="text-sm text-red-500">{mailError}</p>}
            <div className="flex justify-end gap-2">
              <PrimaryButton label={t("profile.access.change")} busy={mailBusy} disabled={!newMail.trim()} onClick={changeEmail} />
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-gf-border" />

      <div className="flex flex-col gap-3">
        <button
          id="gf-change-password-toggle"
          data-tour="prof-access-password"
          type="button"
          aria-expanded={open === "password"}
          onClick={() => toggle("password")}
          className="flex items-center justify-between gap-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-gf-text">{t("profile.access.changePassword")}</span>
            <span className="block text-sm text-gf-text-muted">{t("profile.access.passwordHint")}</span>
          </span>
          <span className="shrink-0 rounded-full gf-glass-inset px-4 py-2 text-sm text-gf-text">
            {open === "password" ? t("profile.access.close") : t("profile.access.open")}
          </span>
        </button>
        {open === "password" && (
          <div className="flex flex-col gap-3">
            <ProfileField
              label={t("profile.access.newPassword")}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <ProfileField
              label={t("profile.access.repeatPassword")}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            <div className="flex justify-end gap-2">
              <PrimaryButton label={t("profile.access.savePassword")} busy={passwordBusy} disabled={!password} onClick={changePassword} />
            </div>
          </div>
        )}
      </div>
    </ProfileCard>
  );
}
