"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoMdExit } from "react-icons/io";
import { authClient } from "@/lib/auth/authClient";
import { useT } from "@/i18n/client";

// Signing out lives on the profile only. It ends the session and returns to the login. As wide as the cards above it, so it
// lines up with them.
export default function ProfileSignOut(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState<boolean>(false);

  const signOut = (): void => {
    setSigningOut(true);
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
        onError: () => setSigningOut(false),
      },
    });
  };

  return (
    <button
      type="button"
      data-tour="prof-signout"
      onClick={signOut}
      disabled={signingOut}
      className="gf-glass-card flex w-full items-center justify-center gap-2 rounded-3xl px-5 py-4 text-base font-semibold text-red-400 transition-all hover:brightness-110 disabled:opacity-60"
    >
      <IoMdExit size={20} />
      <span>{signingOut ? t("profile.signingOut") : t("profile.signOut")}</span>
    </button>
  );
}
