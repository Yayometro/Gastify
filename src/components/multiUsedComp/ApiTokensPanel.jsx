"use client";

import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import dayjs from "dayjs";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "./CategoIcon";

// Lets the user generate/revoke personal access tokens for third-party AI
// agent connectors (Claude, later ChatGPT). See
// .mds/AI_AGENT_CONNECTOR_PLAN.md for the full architecture this feeds.
function ApiTokensPanel({ mail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [newTokenName, setNewTokenName] = useState("");
  // Shown exactly once, right after creation - never persisted or re-fetchable.
  const [justCreatedToken, setJustCreatedToken] = useState(null);
  const toFetch = fetcher();

  const loadTokens = async () => {
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

  const handleCreate = async (e) => {
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

  const handleRevoke = async (tokenId) => {
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
    <div className="api-tokens-panel w-full bg-purple-100 rounded-3xl p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl text-purple-800 font-normal">Connector access tokens</h2>
        <CategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-3">
            Personal tokens for AI agent connectors (Claude, ChatGPT) to create transactions on
            your behalf. Each one is shown only once at creation - store it wherever the
            connector asks for it, then it can&apos;t be viewed again (only revoked).
          </p>

          {justCreatedToken && (
            <div className="bg-white border-2 border-purple-400 rounded-2xl p-3 mb-4">
              <p className="text-xs font-semibold text-purple-800 mb-1">
                Copy this token now - it won&apos;t be shown again:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-purple-50 rounded-xl px-2 py-2 break-all">
                  {justCreatedToken}
                </code>
                <button
                  type="button"
                  className="shrink-0 bg-purple-600 text-white text-xs rounded-full px-3 py-2 hover:bg-purple-500"
                  onClick={() => {
                    navigator.clipboard.writeText(justCreatedToken);
                    runNotify("ok", "Copied to clipboard 🤓");
                  }}
                >
                  Copy
                </button>
              </div>
              <button
                type="button"
                className="text-[11px] text-gray-500 underline mt-2"
                onClick={() => setJustCreatedToken(null)}
              >
                Done, hide this
              </button>
            </div>
          )}

          <ul className="flex flex-col gap-2 mb-4">
            {tokens.length === 0 ? (
              <li className="text-xs text-gray-400 italic">No tokens yet.</li>
            ) : (
              tokens.map((t) => (
                <li
                  key={t._id}
                  className="flex justify-between items-center bg-white rounded-2xl px-4 py-2"
                >
                  <div className="flex flex-col">
                    <p className="text-purple-800">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      Created {dayjs(t.createdAt).format("DD/MM/YYYY")} · Last used{" "}
                      {t.lastUsedAt ? dayjs(t.lastUsedAt).format("DD/MM/YYYY HH:mm") : "never"}
                    </p>
                  </div>
                  <div
                    className="cursor-pointer text-red-500"
                    onClick={() => handleRevoke(t._id)}
                  >
                    <CategoIcon type="MdClose" siz={20} />
                  </div>
                </li>
              ))
            )}
          </ul>

          <form
            onSubmit={handleCreate}
            className="form-trans-edit flex flex-col sm:flex-row gap-2 items-stretch sm:items-end bg-white rounded-2xl p-3"
          >
            <div className="flex flex-col flex-1">
              <p className="label-tfp mb-1">Name</p>
              <input
                type="text"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="e.g. Claude connector"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-purple-600 text-white rounded-full px-4 py-2 hover:bg-purple-500"
            >
              {isLoading ? <Spin /> : "Generate token"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ApiTokensPanel;
