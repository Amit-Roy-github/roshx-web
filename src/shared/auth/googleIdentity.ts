const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** The slice of Google Identity Services this app uses, and nothing more. */
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize(config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }): void;
                    renderButton(
                        parent: HTMLElement,
                        options: {
                            theme?: 'outline' | 'filled_blue' | 'filled_black';
                            size?: 'small' | 'medium' | 'large';
                            width?: number;
                            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
                        },
                    ): void;
                };
            };
        };
    }
}

let scriptLoad: Promise<void> | null = null;

/**
 * Loads Google's script once, however many callers ask for it.
 *
 * Fetched on demand rather than from index.html: most visits never sign in, and
 * a third-party script on the critical path would slow every one of them down
 * for the few that do.
 */
export function loadGoogleIdentity(): Promise<void> {
    if (window.google?.accounts?.id) {
        return Promise.resolve();
    }
    scriptLoad ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener(
            'error',
            () => {
                // Cleared so a later attempt can try again — a blocked network or
                // an ad blocker is often gone by the time somebody retries.
                scriptLoad = null;
                reject(new Error('Could not reach Google Sign-In.'));
            },
            { once: true },
        );
        document.head.appendChild(script);
    });
    return scriptLoad;
}
