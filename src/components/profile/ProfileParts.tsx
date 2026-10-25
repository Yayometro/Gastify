"use client";

import React, { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import fetcher from "@/helpers/fetcher";
import type { UserData } from "@/lib/features/userSlice";

// Every change to the account (name, phone, e-mail, password, photo, language, country) goes through the same route the phone uses.
interface AccountReply {
  ok?: boolean;
  message?: string;
  data?: UserData | null;
}

export async function saveAccount(body: Record<string, unknown>): Promise<UserData | null> {
  const res = (await fetcher().post("general-data/user/update-user", body)) as AccountReply;
  if (!res.ok) throw new Error(res.message || "");
  return res.data ?? null;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// A rounded card, the same as the phone's: a title on the left, the content under it.
export function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="gf-glass-card flex flex-col gap-4 rounded-3xl p-5">
      <h2 className="text-base font-semibold text-gf-text">{title}</h2>
      {children}
    </section>
  );
}

// A labelled text input in the phone's style: the label above, a rounded field.
export function ProfileField({ label, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gf-text-muted">{label}</span>
      <input
        className="rounded-2xl border border-gf-border bg-gf-surface px-4 py-3 text-base text-gf-text outline-none focus:border-purple-400"
        {...input}
      />
    </label>
  );
}

// The main action of a card (the purple glass button, as the phone's gradient one).
export function PrimaryButton({ label, busy = false, ...button }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; busy?: boolean }) {
  return (
    <button
      type="button"
      {...button}
      disabled={busy || button.disabled}
      className="gf-glass-button rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {busy ? "…" : label}
    </button>
  );
}
