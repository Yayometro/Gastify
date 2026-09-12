"use client";

import React, { useState } from "react";
import { Spin } from "antd";
import dayjs from "dayjs";
import { authClient } from "@/lib/auth/authClient";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "./CategoIcon";

// Same collapsible-panel pattern as ApiTokensPanel - register/list/remove a
// passkey (Face ID, Touch ID, Windows Hello, or a physical security key) for
// this account. `useListPasskeys` is the auto-generated React hook for
// Better Auth's `listPasskeys` atom (see @better-auth/passkey/client).
function PasskeysPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const { data: passkeys, isPending } = authClient.useListPasskeys();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPasskeyName.trim()) return;
    try {
      setIsLoading(true);
      const { error } = await authClient.passkey.addPasskey({ name: newPasskeyName.trim() });
      if (error) {
        runNotify("error", error.message || "Could not register that passkey 🤕");
        return;
      }
      runNotify("ok", "Passkey added 🤓");
      setNewPasskeyName("");
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        runNotify("error", error.message || "Could not remove that passkey 🤕");
        return;
      }
      runNotify("ok", "Passkey removed 🤓");
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
        <h2 className="text-xl text-purple-300 font-normal">Passkeys</h2>
        <CategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <p className="text-xs text-gf-text-muted mb-3">
            Sign in with Face ID, Touch ID, Windows Hello, or a security key instead of your
            password - Gastify never sees or stores the biometric/PIN itself, only proof it
            unlocked your device.
          </p>

          <ul className="flex flex-col gap-2 mb-4">
            {isPending ? (
              <li className="text-xs text-gf-text-muted italic">Loading…</li>
            ) : !passkeys || passkeys.length === 0 ? (
              <li className="text-xs text-gf-text-muted italic">No passkeys yet.</li>
            ) : (
              passkeys.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center bg-gf-surface rounded-2xl px-4 py-2"
                >
                  <div className="flex flex-col">
                    <p className="text-purple-300">{p.name || "Unnamed passkey"}</p>
                    <p className="text-xs text-gf-text-muted">
                      Added {dayjs(p.createdAt).format("DD/MM/YYYY")}
                    </p>
                  </div>
                  <div
                    className="cursor-pointer text-red-500"
                    onClick={() => handleDelete(p.id)}
                  >
                    <CategoIcon type="MdClose" siz={20} />
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
              <p className="label-tfp mb-1">Name</p>
              <input
                type="text"
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                placeholder="e.g. My iPhone"
                required
              />
            </div>
            <button
              type="submit"
              className="gf-glass-button text-white rounded-full px-4 py-2"
            >
              {isLoading ? <Spin /> : "Add passkey"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PasskeysPanel;
