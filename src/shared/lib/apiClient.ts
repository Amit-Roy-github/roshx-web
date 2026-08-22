import { createApiClient } from '@roshx/ui';
import { environment } from '@/shared/lib/env';

// Writing a passage is a model call: it takes the better part of twenty
// seconds, so the kit's 15s default would abort a request that was going to
// succeed.
const REQUEST_TIMEOUT_MS = 180_000;

/** The single axios instance this app talks to the roshx API through. */
export const apiClient = createApiClient({
    baseUrl: environment.VITE_API_BASE_URL,
    timeoutMs: REQUEST_TIMEOUT_MS,
});
