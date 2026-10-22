"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoMdExit } from "react-icons/io";
import { authClient } from "@/lib/auth/authClient";

// Signing out lives on the profile only (the navigation bar no longer has it). It ends the session and returns to the login.
function SignOutPanel(): React.JSX.Element {
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
    <div className="w-full px-4 sm:px-[150px] md:px-[200px] lg:px-[300px] xl:px-[400px] pb-6">
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 rounded-full gf-glass-button-neutral text-red-300 p-3 cursor-pointer disabled:opacity-60"
      >
        <IoMdExit size={20} />
        <span className="font-semibold">{signingOut ? "Cerrando sesión…" : "Cerrar sesión"}</span>
      </button>
    </div>
  );
}

export default SignOutPanel;
