"use client";

import { authClient } from "@/lib/auth/authClient";

function useGetUserSession() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return {
      user: null,
      email: null,
      status: "loading",
    };
  }
  if (session) {
    if (!session.user.email) throw new Error("No email in session user");
    return {
      user: session.user,
      email: session.user.email,
      status: "authenticated",
    };
  }
  // No session and not pending - a legitimate, expected state now (not an
  // exceptional one): sign-out flips Better Auth's client-side session atom
  // to null immediately, client-side, well before the page has navigated
  // away from a still-mounted dashboard tree. Throwing here used to be safe
  // under NextAuth, where the server-side middleware/layout check always
  // ran before this component could even mount - but Better Auth's
  // useSession() is reactive, so this state is now reachable mid-sign-out
  // while still mounted. Every consumer (useFetchAndGetAllReduxInfo, etc.)
  // already handles a falsy `email` by simply not dispatching fetches, so
  // returning cleanly here - instead of throwing and breaking the pending
  // signOut()-triggered navigation - is what actually lets sign-out finish.
  return {
    user: null,
    email: null,
    status: "unauthenticated",
  };
}

export default useGetUserSession;
