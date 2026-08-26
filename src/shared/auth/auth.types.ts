/** Who is signed in. Only what the server is willing to say about them. */
export interface AuthUser {
    id: string;
    email: string;
}

/** What the server hands back on register, login and refresh alike. */
export interface AuthSession {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}

export interface EmailPasswordCredentials {
    email: string;
    password: string;
}
