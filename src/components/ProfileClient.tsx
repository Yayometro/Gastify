"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import AccountLanguage, { type AccountLanguageChoice } from "@/i18n/AccountLanguage";
import { isLocale } from "@gastify/core/i18n/locales";
import { longDate } from "@gastify/core/i18n/dates";
import { initialsOf } from "@gastify/core/profile/profileForm";
import runNotify from "@/helpers/gastifyNotifier";
import { fetchUser, updateUser, type UserData } from "@/lib/features/userSlice";
import type { RootState, AppDispatch } from "@/lib/store";
import { useLocale, useT } from "@/i18n/client";
import EmptyModule from "./multiUsedComp/EmptyModule";
import PasskeysPanel from "./multiUsedComp/PasskeysPanel";
import TwoFactorPanel from "./multiUsedComp/TwoFactorPanel";
import ApiTokensPanel from "./multiUsedComp/ApiTokensPanel";
import DeleteAccountPanel from "./multiUsedComp/DeleteAccountPanel";
import ProfileDataCard from "./profile/ProfileDataCard";
import ProfileAccessCard from "./profile/ProfileAccessCard";
import ProfileSignOut from "./profile/ProfileSignOut";
import ProfileCountryCard from "./profile/ProfileCountryCard";
import TourProfileCard from "./tour/TourProfileCard";
import ProfileAppearanceCard from "./profile/ProfileAppearanceCard";
import TutorialTip from "./tour/TutorialTip";
import { ProfileCard, errorMessage, saveAccount } from "./profile/ProfileParts";
import DemoProfileSettings from "@/components/demo/DemoProfileSettings";

const TypedEmptyModule = EmptyModule as React.ComponentType<{ emMessage?: string }>;
const TypedApiTokensPanel = ApiTokensPanel as React.ComponentType<{ mail?: string }>;

interface ProfileClientProps {
  pcSession?: string;
  readOnly?: boolean;
}

type Section = "profile" | "privacy";

function ProfileClient({ pcSession, readOnly = false }: ProfileClientProps): React.JSX.Element {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const userData = ccUser.data as UserData | undefined;
  const [section, setSection] = useState<Section>("profile");

  useEffect(() => {
    if (!readOnly && ccUser.status === "idle") {
      dispatch(fetchUser(pcSession));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, dispatch, pcSession]);

  const sections: { id: Section; label: string }[] = [
    { id: "profile", label: t("profile.section.profile") },
    { id: "privacy", label: t("profile.section.privacy") },
  ];

  if (readOnly) {
    return (
      <div className="w-full content-profile-cont content-wallet-glass rounded-t-[100px] rounded-b-2xl px-4 pb-12 pt-8 text-center">
        <Image
          className="rounded-full border border-purple-500 m-auto w-[110px] sm:w-[140px] shadow-md"
          src="/img/profile/user-non-profile.jpg"
          alt={t("navbar.profileAlt", { p1: "Alex Rivera" })}
          width={150}
          height={150}
        />
        <h1 className="pt-5 text-3xl">Alex Rivera<span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip className="ml-0.5" tour="profile" label={t("navbar.profile")} /></h1>
        <p className="mt-1 text-sm text-gf-text-muted">{t("shared.demo.profileSubtitle")}</p>
        <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col items-start gap-5 rounded-3xl border border-purple-300/15 bg-black/10 p-5 text-left sm:p-7" data-tour="prof-header">
          <div className="w-full">
            <p className="text-[11px] text-gf-text-muted">{t("profile.fullName.label")}</p>
            <div className="gf-profile-field mt-1 w-full truncate rounded-xl border border-purple-400/50 px-3 py-2 text-lg font-light">Alex Rivera</div>
          </div>
          <div className="w-full">
            <p className="text-[11px] text-gf-text-muted">{t("profile.mail.label")}</p>
            <div className="gf-profile-field mt-1 w-full truncate rounded-xl border border-purple-400/50 px-3 py-2 text-lg font-light">alex@example.test</div>
          </div>
          <div className="w-full">
            <p className="text-[11px] text-gf-text-muted">{t("profile.phone.label")}</p>
            <div className="gf-profile-field mt-1 w-full truncate rounded-xl border border-purple-400/50 px-3 py-2 text-lg font-light">+52 55 0000 0000</div>
          </div>
          <p className="w-full rounded-2xl border border-purple-200/15 bg-purple-300/5 px-4 py-3 text-xs leading-relaxed text-gf-text-muted">{t("shared.demo.createReadonly")}</p>
        </div>
        <DemoProfileSettings />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center content-wallet-glass rounded-2xl h-screen">
        <TypedEmptyModule emMessage={t("profile.noUserData")} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:flex-row md:items-start md:p-8">
      <nav aria-label={t("profile.section.profile")} className="flex shrink-0 gap-2 overflow-x-auto md:sticky md:top-6 md:w-56 md:flex-col">
        {sections.map((item) => {
          const active = item.id === section;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setSection(item.id)}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${active ? "gf-glass-button text-white" : "gf-glass-card text-gf-text-muted hover:text-gf-text"}`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 justify-center">
        <main className="flex w-full max-w-3xl flex-col gap-4">
          {section === "profile" ? <ProfilePanel user={userData} pcSession={pcSession} /> : <PrivacyPanel />}
        </main>
      </div>
    </div>
  );
}

function ProfilePanel({ user, pcSession }: { user: UserData; pcSession?: string }): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const created = user.createdAt ? new Date(user.createdAt) : null;

  const savePhoto = async (url: string) => {
    try {
      const updated = await saveAccount({ image: url });
      if (updated) dispatch(updateUser(updated));
      runNotify("ok", t("profile.data.saved"));
    } catch (error) {
      runNotify("error", errorMessage(error));
    }
  };

  const onPhotoUploaded = (result: CloudinaryUploadWidgetResults) => {
    if (typeof result.info === "object" && result.info && "secure_url" in result.info && result.info.secure_url) {
      void savePhoto(result.info.secure_url);
    }
  };

  const saveLanguage = async (choice: AccountLanguageChoice) => {
    try {
      const updated = await saveAccount({ language: choice });
      if (updated) dispatch(updateUser(updated));
    } catch (error) {
      runNotify("error", errorMessage(error));
      throw error;
    }
  };

  return (
    <>
      <header className="flex flex-col items-center gap-3 py-2" data-tour="prof-header">
        {user.image ? (
          <Image className="rounded-full border border-gf-border object-cover shadow-md" src={user.image} alt={t("navbar.profileAlt", { p1: user.fullName })} width={96} height={96} />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-700 text-3xl font-bold text-white shadow-md">{initialsOf(user.fullName)}</div>
        )}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-gf-text">{user.fullName || "—"}</p>
          </div>
          <p className="text-sm text-gf-text-muted">{user.mail}</p>
        </div>
        <CldUploadWidget uploadPreset="Gastify_Cloudinary_Preset" onSuccess={(success) => onPhotoUploaded(success)}>
          {({ open }) => <button type="button" data-tour="prof-photo-button" onClick={() => open()} className="rounded-full gf-glass-inset px-4 py-2 text-sm font-semibold text-gf-text">{t("profile.photo.change")}</button>}
        </CldUploadWidget>
      </header>

      <ProfileDataCard user={user} />
      <ProfileAccessCard email={user.mail ?? ""} />
      <ProfileCard title={t("profile.language.title")} tour="prof-language" help={<><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="profLanguage" label={t("profile.language.title")} /></>}>
        <AccountLanguage current={isLocale(user.language) ? user.language : null} onSave={saveLanguage} />
      </ProfileCard>
      <ProfileCountryCard />
      <ProfileAppearanceCard />
      <ProfileCard title={t("profile.account.title")} tour="prof-account">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gf-text-muted">{t("profile.account.email")}</span>
            <span className="truncate text-sm font-semibold text-gf-text">{user.mail}</span>
          </div>
          {created && !Number.isNaN(created.getTime()) && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gf-text-muted">{t("profile.account.since")}</span>
              <span className="text-sm font-semibold text-gf-text">{longDate(created, locale)}</span>
            </div>
          )}
        </div>
      </ProfileCard>
      <div className="flex flex-col gap-4">
        <PasskeysPanel />
        <TwoFactorPanel />
      </div>
      <div data-tour="prof-ai">
        <TypedApiTokensPanel mail={pcSession} />
      </div>
      <TourProfileCard />
      <ProfileSignOut />
      <DeleteAccountPanel />
    </>
  );
}

function PrivacyPanel(): React.JSX.Element {
  const t = useT();
  return <ProfileCard title={t("profile.section.privacy")}><p className="text-sm text-gf-text-muted">{t("profile.privacy.soon")}</p></ProfileCard>;
}

export default ProfileClient;
