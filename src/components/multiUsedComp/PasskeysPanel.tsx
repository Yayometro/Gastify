"use client";

import React, { useState } from "react";
import { Spin } from "antd";
import dayjs from "dayjs";
import { authClient } from "@/lib/auth/authClient";
import runNotify from "@/helpers/gastifyNotifier";
import { redirectIfStepUpRequired } from "@/lib/auth/stepUpRedirect";
import CategoIcon from "./CategoIcon";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { useT, useInfo } from "@/i18n/client";

// Unmigrated JS CategoIcon infers required className from destructured params; typed bridge component
const TypedCategoIcon = CategoIcon as React.ComponentType<{
  type: string;
  siz?: number;
  className?: string;
}>;

interface PasskeyItem {
  id: string;
  name?: string | null;
  createdAt: string | number | Date;
  [key: string]: unknown;
}

// Same collapsible-panel pattern as ApiTokensPanel - register/list/remove a
// passkey (Face ID, Touch ID, Windows Hello, or a physical security key) for
// this account. `useListPasskeys` is the auto-generated React hook for
// Better Auth's `listPasskeys` atom (see @better-auth/passkey/client).
function PasskeysPanel(): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newPasskeyName, setNewPasskeyName] = useState<string>("");
  const { data: passkeys, isPending } = authClient.useListPasskeys();

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newPasskeyName.trim()) return;
    try {
      setIsLoading(true);
      const { error } = await authClient.passkey.addPasskey({ name: newPasskeyName.trim() });
      if (error) {
        if (redirectIfStepUpRequired(error, t("auth.stepUp"))) return;
        runNotify("error", error.message || t("web.could.not.register.that.passkey"));
        return;
      }
      runNotify("ok", t("auth.passkey.added"));
      setNewPasskeyName("");
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        if (redirectIfStepUpRequired(error, t("auth.stepUp"))) return;
        runNotify("error", error.message || t("web.could.not.remove.that.passkey"));
        return;
      }
      runNotify("ok", t("auth.passkey.removed"));
      // Gastify can only forget its half: the copy kept by the device or
      // password manager (iCloud Keychain, Google Password Manager...) stays
      // until the user removes it there.
      runNotify(
        "info",
        t("auth.passkey.removedNote")
      );
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="passkeys-panel w-full bg-gf-accent-soft-bg rounded-3xl p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="inline-flex items-center gap-1.5"><h2 className="text-xl text-purple-300 font-normal">{t("auth.passkeys.title")}</h2><InfoTip info={APP_INFO.passkeys} /></span>
        <TypedCategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <p className="text-xs text-gf-text-muted mb-3">
            {t("auth.passkey.explain")}
          </p>

          <ul className="flex flex-col gap-2 mb-4">
            {isPending ? (
              <li className="text-xs text-gf-text-muted italic">{t("auth.loading")}</li>
            ) : !passkeys || passkeys.length === 0 ? (
              <li className="text-xs text-gf-text-muted italic">{t("auth.passkey.none")}</li>
            ) : (
              (passkeys as PasskeyItem[]).map((p: PasskeyItem) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center bg-gf-surface rounded-2xl px-4 py-2"
                >
                  <div className="flex flex-col">
                    <p className="text-purple-300">{p.name || t("auth.passkey.unnamed")}</p>
                    <p className="text-xs text-gf-text-muted">
                      {t("auth.passkey.addedOn", { date: dayjs(p.createdAt).format("DD/MM/YYYY") })}
                    </p>
                  </div>
                  <div
                    className="cursor-pointer text-red-500"
                    onClick={() => handleDelete(p.id)}
                  >
                    <TypedCategoIcon type="MdClose" siz={20} />
                  </div>
                </li>
              ))
            )}
          </ul>

          <form
            onSubmit={handleAdd}
            className="form-trans-edit flex flex-col sm:flex-row gap-2 items-stretch sm:items-end bg-gf-surface rounded-2xl p-3"
          >
            <div className="flex flex-col flex-1">
              <p className="label-tfp mb-1">{t("auth.passkey.nameLabel")}</p>
              <input
                type="text"
                value={newPasskeyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPasskeyName(e.target.value)}
                placeholder={t("auth.passkey.namePlaceholder")}
                required
              />
            </div>
            <button
              type="submit"
              className="gf-glass-button text-white rounded-full px-4 py-2"
            >
              {isLoading ? <Spin /> : t("web.add.passkey")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PasskeysPanel;
