import { useEffect, useRef } from 'react';
import { environment } from '@/shared/lib/env';
import { loadGoogleIdentity } from '@/shared/auth/googleIdentity';

const DEFAULT_BUTTON_WIDTH = 320;

interface GoogleSignInButtonProps {
    onCredential: (idToken: string) => void;
    onUnavailable: (message: string) => void;
}

/**
 * Google's own button, rendered by Google into a div this component lends it.
 *
 * It has to be their markup: the button is what proves to Google which origin
 * asked, and a look-alike of our own could not produce a credential at all.
 */
export function GoogleSignInButton({ onCredential, onUnavailable }: GoogleSignInButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // The callbacks are read when Google fires, which is long after this effect
    // set things up, so they are reached through a ref rather than made
    // dependencies — otherwise every keystroke in the form would re-render the
    // button underneath the person about to click it.
    const latestHandlersRef = useRef({ onCredential, onUnavailable });
    useEffect(() => {
        latestHandlersRef.current = { onCredential, onUnavailable };
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        let isCancelled = false;

        loadGoogleIdentity()
            .then(() => {
                if (isCancelled || !window.google) {
                    return;
                }
                window.google.accounts.id.initialize({
                    client_id: environment.VITE_GOOGLE_CLIENT_ID,
                    callback: ({ credential }) => latestHandlersRef.current.onCredential(credential),
                });
                window.google.accounts.id.renderButton(container, {
                    theme: 'outline',
                    size: 'large',
                    width: Math.min(DEFAULT_BUTTON_WIDTH, container.offsetWidth || DEFAULT_BUTTON_WIDTH),
                    text: 'continue_with',
                });
            })
            .catch((error: Error) => {
                if (!isCancelled) {
                    latestHandlersRef.current.onUnavailable(error.message);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, []);

    return <div ref={containerRef} className="flex justify-center" />;
}
