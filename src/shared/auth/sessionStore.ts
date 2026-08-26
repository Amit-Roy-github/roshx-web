import { HttpHeader } from '@roshx/core';
import { environment } from '@/shared/lib/env';
import { StorageKey } from '@/shared/auth/storageKey.enum';
import type { AuthSession, AuthUser } from '@/shared/auth/auth.types';

const REFRESH_PATH = '/roshx/auth/refresh';

/**
 * Where the session lives, and the one thing that changes it.
 *
 * Deliberately outside React: the api client has to read the token from an
 * interceptor and clear it when the session dies, neither of which happens
 * inside a component. React subscribes to this rather than owning it.
 */

// Parsed once and kept, because useSyncExternalStore compares snapshots by
// reference — parsing on every read would hand back a new object each time and
// re-render for ever.
let currentUser: AuthUser | null = readStoredUser();

const listeners = new Set<() => void>();

function readStoredUser(): AuthUser | null {
    const storedUser = localStorage.getItem(StorageKey.USER);
    if (!storedUser) {
        return null;
    }
    try {
        return JSON.parse(storedUser) as AuthUser;
    } catch {
        // Somebody edited it, or an older version wrote a different shape.
        // Either way it is unreadable, and signed-out is the safe reading.
        return null;
    }
}

function publish(): void {
    currentUser = readStoredUser();
    for (const listener of listeners) {
        listener();
    }
}

// Signing out in one tab signs out in the rest. The storage event only fires in
// the tabs that did not make the change, which is exactly the set that has no
// other way to find out.
window.addEventListener('storage', (event) => {
    if (event.key === StorageKey.USER || event.key === null) {
        publish();
    }
});

export function subscribeToSession(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** The signed-in user, or null. Stable between changes, so React can watch it. */
export function getSessionUser(): AuthUser | null {
    return currentUser;
}

export function getAccessToken(): string | null {
    return localStorage.getItem(StorageKey.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(StorageKey.REFRESH_TOKEN);
}

export function persistSession(session: AuthSession): void {
    localStorage.setItem(StorageKey.ACCESS_TOKEN, session.accessToken);
    localStorage.setItem(StorageKey.REFRESH_TOKEN, session.refreshToken);
    localStorage.setItem(StorageKey.USER, JSON.stringify(session.user));
    publish();
}

export function clearPersistedSession(): void {
    localStorage.removeItem(StorageKey.ACCESS_TOKEN);
    localStorage.removeItem(StorageKey.REFRESH_TOKEN);
    localStorage.removeItem(StorageKey.USER);
    publish();
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Trades the stored refresh token for a new session.
 *
 * Concurrent callers share one request. Without that, a page firing five calls
 * at once would spend five refresh tokens on the same expiry — and the server
 * revokes each token as it is used, so four would come back rejected and sign
 * the reader out mid-session.
 */
export function refreshSession(): Promise<boolean> {
    refreshInFlight ??= performRefresh().finally(() => {
        refreshInFlight = null;
    });
    return refreshInFlight;
}

async function performRefresh(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }

    // Deliberately not apiClient: that client answers a 401 by refreshing, so
    // refreshing through it would call itself.
    const response = await fetch(`${environment.VITE_API_BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { [HttpHeader.CONTENT_TYPE]: 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
        clearPersistedSession();
        return false;
    }

    persistSession((await response.json()) as AuthSession);
    return true;
}
