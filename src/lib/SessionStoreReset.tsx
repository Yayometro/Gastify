"use client";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { authClient } from "@/lib/auth/authClient";
import { resetStore } from "./rootReducer";

// Empties the Redux store whenever the signed-in account changes: signing out
// (any path - Navbar, /verify-2fa, account deletion, an expired session) or
// switching straight to a different user. Signing in from "nobody" does not
// reset again, because the store was already emptied when that previous
// session ended and a reset then could wipe data the new session just loaded.
export default function SessionStoreReset(): null {
    const dispatch = useDispatch();
    const { data, isPending } = authClient.useSession();
    const userId = (data as { user?: { id?: string } } | null | undefined)?.user?.id ?? null;
    const lastUserId = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        if (isPending) return;
        const previous = lastUserId.current;
        lastUserId.current = userId;
        if (previous === undefined) return;
        if (previous !== null && previous !== userId) dispatch(resetStore());
    }, [userId, isPending, dispatch]);

    return null;
}
