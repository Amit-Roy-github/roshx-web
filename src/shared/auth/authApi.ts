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
 * Ends the session on the server too, so the refresh token cannot be used
 * again by whatever else has a copy of it.
 */
export async function logout(refreshToken: string): Promise<void> {
    await apiClient.post(`${AUTH_PATH}/logout`, { refreshToken });
}
