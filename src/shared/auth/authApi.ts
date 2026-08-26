import { apiClient } from '@/shared/lib/apiClient';
import type { AuthSession, EmailPasswordCredentials } from '@/shared/auth/auth.types';

const AUTH_PATH = '/roshx/auth';

export async function register(credentials: EmailPasswordCredentials): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>(`${AUTH_PATH}/register`, credentials);
    return response.data;
}

export async function login(credentials: EmailPasswordCredentials): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>(`${AUTH_PATH}/login`, credentials);
    return response.data;
}

/**
 * Signs in with the id token Google hands back, which the server verifies
 * against Google itself — this app never sees a password and cannot vouch for
 * the token on its own.
 *
 * The same call registers somebody arriving for the first time: Google has
 * already told us who they are, so asking them to choose sign-in or sign-up
 * would be asking about our storage, not about them.
 */
export async function loginWithGoogle(idToken: string): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>(`${AUTH_PATH}/login/google`, { idToken });
    return response.data;
}

/**
 * Ends the session on the server too, so the refresh token cannot be used
 * again by whatever else has a copy of it.
 */
export async function logout(refreshToken: string): Promise<void> {
    await apiClient.post(`${AUTH_PATH}/logout`, { refreshToken });
}
