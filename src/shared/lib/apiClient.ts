import { createApiClient } from '@roshx/ui';
import { environment } from '@/shared/lib/env';
import { clearPersistedSession, getAccessToken, refreshSession } from '@/shared/auth/sessionStore';

// Writing a passage is a model call: it takes the better part of twenty
// seconds, so the kit's 15s default would abort a request that was going to
// succeed.
const REQUEST_TIMEOUT_MS = 180_000;

/** The single axios instance this app talks to the roshx API through. */
export const apiClient = createApiClient({
    baseUrl: environment.VITE_API_BASE_URL,
    timeoutMs: REQUEST_TIMEOUT_MS,
    getAuthToken: getAccessToken,
    refreshAuth: refreshSession,
    // Storage is cleared, but nothing is redirected: practice works signed out,
    // and throwing somebody off the passage they are typing because a token
    // aged out would be a strange thing to do to them.
    onUnauthenticated: clearPersistedSession,
});
