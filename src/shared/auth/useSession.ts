import { useCallback, useSyncExternalStore } from 'react';
import { login, loginWithGoogle, logout, register } from '@/shared/auth/authApi';
import {
    clearPersistedSession,
    getRefreshToken,
    getSessionUser,
    persistSession,
    subscribeToSession,
} from '@/shared/auth/sessionStore';
import type { AuthUser, EmailPasswordCredentials } from '@/shared/auth/auth.types';

export interface Session {
    user: AuthUser | null;
    isSignedIn: boolean;
    signIn: (credentials: EmailPasswordCredentials) => Promise<void>;
    signUp: (credentials: EmailPasswordCredentials) => Promise<void>;
    /** Both sign-in and sign-up: Google has already said who this is. */
    signInWithGoogle: (idToken: string) => Promise<void>;
    signOut: () => Promise<void>;
}

/**
 * Who is signed in, and the three ways that changes.
 *
 * No context and no provider: the session lives in sessionStore, which is where
 * the api client already reaches for it. A context would only be a second copy
 * of the same fact, and one of the two would eventually be stale.
 */
export function useSession(): Session {
    const user = useSyncExternalStore(subscribeToSession, getSessionUser);

    const signIn = useCallback(async (credentials: EmailPasswordCredentials) => {
        persistSession(await login(credentials));
    }, []);

    const signUp = useCallback(async (credentials: EmailPasswordCredentials) => {
        persistSession(await register(credentials));
    }, []);

    const signInWithGoogle = useCallback(async (idToken: string) => {
        persistSession(await loginWithGoogle(idToken));
    }, []);

    const signOut = useCallback(async () => {
        const refreshToken = getRefreshToken();
        // Cleared first, and regardless. Whether the server heard about it
        // changes nothing for the person who asked to be signed out.
        clearPersistedSession();
        if (refreshToken) {
            await logout(refreshToken).catch(() => undefined);
        }
    }, []);

    return { user, isSignedIn: user !== null, signIn, signUp, signInWithGoogle, signOut };
}
