"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import { updateUser, type UserData } from "@/lib/features/userSlice";
import type { AppDispatch } from "@/lib/store";
import { useT } from "@/i18n/client";
import { PROFILE_NAME_MAX, buildProfileBody, phoneDigits, profileToValues, validateProfile, type ProfileErrors, type ProfileValues } from "@gastify/core/profile/profileForm";
import { ProfileCard, ProfileField, PrimaryButton, errorMessage, saveAccount } from "./ProfileParts";

// The name and the phone, as on the phone: the same checks, and the phone is saved as digits.
export default function ProfileDataCard({ user }: { user: UserData }) {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const saved = profileToValues(user);
  const [values, setValues] = useState<ProfileValues>(saved);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [busy, setBusy] = useState<boolean>(false);

  // When the account changes (saved here or somewhere else), the fields show the saved values again.
  useEffect(() => {
    setValues({ fullName: user.fullName ?? "", phone: user.phone ? String(user.phone) : "" });
  }, [user.fullName, user.phone]);

  const unchanged = values.fullName.trim() === saved.fullName && phoneDigits(values.phone) === phoneDigits(saved.phone);

  const save = async () => {
    const found = validateProfile(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      const updated = await saveAccount(buildProfileBody(values));
      if (updated) dispatch(updateUser(updated));
      runNotify("ok", t("profile.data.saved"));
    } catch (error) {
      runNotify("error", errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileCard title={t("profile.data.title")}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <ProfileField
            label={t("profile.data.name")}
            value={values.fullName}
            maxLength={PROFILE_NAME_MAX}
            autoComplete="name"
            onChange={(event) => setValues({ ...values, fullName: event.target.value })}
          />
          {errors.fullName && <p className="text-sm text-red-500">{t(errors.fullName, { p1: PROFILE_NAME_MAX })}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <ProfileField
            label={t("profile.data.phone")}
            value={values.phone}
            inputMode="tel"
            autoComplete="tel"
            placeholder="55 1234 5678"
            onChange={(event) => setValues({ ...values, phone: event.target.value })}
          />
          {errors.phone && <p className="text-sm text-red-500">{t(errors.phone)}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <PrimaryButton label={t("profile.data.save")} busy={busy} disabled={unchanged} onClick={save} />
      </div>
    </ProfileCard>
  );
}
