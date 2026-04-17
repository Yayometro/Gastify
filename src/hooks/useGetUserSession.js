"use client";

import { useSession } from "next-auth/react";

function useGetUserSession() {
  const { data: session, status } = useSession();
  let statusMode;

  if (status === "loading") {
    return {
      user: null,
      email: null,
      status: "loading",
    };
  }
  if (status === "authenticated") {
    if (!session) throw new Error("No session available");
    if (!session.user.email) throw new Error("No email in session user");
    return {
      user: session.user,
      email: session.user.email,
      status: "authenticated",
    };
  }
  if (!session) throw new Error("No session available");
  if (!session.user.email) throw new Error("No email in session user");
}

export default useGetUserSession;
