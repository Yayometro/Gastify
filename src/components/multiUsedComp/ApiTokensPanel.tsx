"use client";

import React, { useEffect, useState } from "react";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { Spin } from "antd";
import dayjs from "dayjs";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "./CategoIcon";
import { useT, useInfo } from "@/i18n/client";

// Unmigrated JS CategoIcon infers required className from destructured params; typed bridge component
const TypedCategoIcon = CategoIcon as React.ComponentType<{
  type: string;
  siz?: number;
  className?: string;
}>;

export interface ApiTokenItem {
  _id: string;
  name: string;
  createdAt: string | number | Date;
  lastUsedAt?: string | number | Date | null;
  [key: string]: unknown;
}

export interface ApiTokensPanelProps {
  mail?: string | null;
}

// Lets the user generate/revoke personal access tokens for third-party AI
// agent connectors (Claude, later ChatGPT). See
// .mds/AI_AGENT_CONNECTOR_PLAN.md for the full architecture this feeds.
function ApiTokensPanel({ mail }: ApiTokensPanelProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const tr = useT();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<ApiTokenItem[]>([]);
  const [newTokenName, setNewTokenName] = useState<string>("");
  // Shown exactly once, right after creation - never persisted or re-fetchable.
  const [justCreatedToken, setJustCreatedToken] = useState<string | null>(null);
  const toFetch = fetcher();

  const loadTokens = async (): Promise<void> => {
    try {
      const res = await toFetch.post("general-data/api-tokens/list", mail);
      if (res.ok) setTokens(res.data || []);
    } catch (err) {
      runNotify("error", String(err));
    }
  };

  useEffect(() => {
    if (isOpen) loadTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/api-tokens/new", {
        mail,
        name: newTokenName.trim(),
      });
      if (res.ok) {
        setJustCreatedToken(res.data.token);
        setNewTokenName("");
        loadTokens();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (tokenId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/api-tokens/remove", { mail, tokenId });
      if (res.ok) {
        runNotify("ok", res.message);
        loadTokens();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="api-tokens-panel w-full bg-gf-accent-soft-bg rounded-3xl p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2"><h2 className="text-xl text-purple-300 font-normal">{tr("shared.tokens.title")}</h2><InfoTip info={APP_INFO.tokens_de_acceso} /></div>
        <TypedCategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <p className="text-xs text-gf-text-muted mb-3">
            {tr("shared.tokens.help")}
          </p>

          {justCreatedToken && (
            <div className="bg-gf-surface border-2 border-purple-400 rounded-2xl p-3 mb-4">
              <p className="text-xs font-semibold text-purple-300 mb-1">
                {tr("shared.tokens.copyNow")}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gf-accent-soft-bg rounded-xl px-2 py-2 break-all">
                  {justCreatedToken}
                </code>
                <button
                  type="button"
                  className="shrink-0 gf-glass-button text-white text-xs rounded-full px-3 py-2"
                  onClick={() => {
                    navigator.clipboard.writeText(justCreatedToken);
                    runNotify("ok", tr("shared.copiedOne"));
                  }}
                >
                  {tr("shared.tokens.copy")}
                </button>
              </div>
              <button
                type="button"
                className="text-[11px] text-gf-text-muted underline mt-2"
                onClick={() => setJustCreatedToken(null)}
              >
                {tr("shared.tokens.doneHide")}
              </button>
            </div>
          )}

          <ul className="flex flex-col gap-2 mb-4">
            {tokens.length === 0 ? (
              <li className="text-xs text-gf-text-muted italic">{tr("shared.tokens.none")}</li>
            ) : (
              tokens.map((t: ApiTokenItem) => (
                <li
                  key={t._id}
                  className="flex justify-between items-center bg-gf-surface rounded-2xl px-4 py-2"
                >
                  <div className="flex flex-col">
                    <p className="text-purple-300">{t.name}</p>
                    <p className="text-xs text-gf-text-muted">
                      {tr("shared.tokens.meta", { p1: dayjs(t.createdAt).format("DD/MM/YYYY"), p2: t.lastUsedAt ? dayjs(t.lastUsedAt).format("DD/MM/YYYY HH:mm") : "never" })}
                    </p>
                  </div>
                  <div
                    className="cursor-pointer text-red-500"
                    onClick={() => handleRevoke(t._id)}
                  >
                    <TypedCategoIcon type="MdClose" siz={20} />
                  </div>
                </li>
              ))
            )}
          </ul>

          <form
            onSubmit={handleCreate}
            className="form-trans-edit flex flex-col sm:flex-row gap-2 items-stretch sm:items-end bg-gf-surface rounded-2xl p-3"
          >
            <div className="flex flex-col flex-1">
              <p className="label-tfp mb-1">{tr("shared.name")}</p>
              <input
                type="text"
                value={newTokenName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenName(e.target.value)}
                placeholder={tr("shared.tokens.namePlaceholder")}
                required
              />
            </div>
            <button
              type="submit"
              className="gf-glass-button text-white rounded-full px-4 py-2"
            >
              {isLoading ? <Spin /> : tr("web.generate.token")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ApiTokensPanel;
