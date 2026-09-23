"use client";

import { authClient } from "@/lib/auth/authClient";

export interface AuthSessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export interface AuthSessionData {
  session: {
    id: string;
    userId: string;
    expiresAt: Date | string;
    [key: string]: unknown;
  };
  user: AuthSessionUser;
}

export type UserSessionStatus = "loading" | "authenticated" | "unauthenticated";

export type UserSession =
  | {
      user: null;
      email: null;
      status: "loading";
    }
  | {
      user: AuthSessionUser;
      email: string;
      status: "authenticated";
    }
  | {
      user: null;
      email: null;
      status: "unauthenticated";
    };

function useGetUserSession(): UserSession {
  // Better Auth's createAuthClient without $InferAuth types useSession().data as never;
  // bridge to AuthSessionData to safely access the reactive session user.
  const { data, isPending } = authClient.useSession();
  const session = data as unknown as AuthSessionData | null;

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
