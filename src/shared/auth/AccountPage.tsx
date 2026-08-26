import { useState, type FormEvent, type ReactNode } from 'react';
import type { ApiError } from '@roshx/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@roshx/ui';
import { AppButton } from '@/shared/components/AppButton';
import { useSession } from '@/shared/auth/useSession';
import { AccountFormMode } from '@/shared/auth/accountFormMode.enum';

const MODE_COPY: Record<
    AccountFormMode,
    { title: string; description: string; submitLabel: string; switchLabel: string }
> = {
    [AccountFormMode.SIGN_IN]: {
        title: 'Sign in',
        description: 'Your notes and passages follow you to any browser you sign in from.',
        submitLabel: 'Sign in',
        switchLabel: 'No account yet? Create one',
    },
    [AccountFormMode.SIGN_UP]: {
        title: 'Create an account',
        description: 'Whatever you have written on this browser comes with you.',
        submitLabel: 'Create account',
        switchLabel: 'Already have an account? Sign in',
    },
};

const UNEXPECTED_FAILURE_MESSAGE = 'Something went wrong. Try again.';

export function AccountPage() {
    const session = useSession();

    if (session.user) {
        return (
            <PageFrame>
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Welcome</CardTitle>
                        <CardDescription>{session.user.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AppButton onClick={() => void session.signOut()}>Sign out</AppButton>
                    </CardContent>
                </Card>
            </PageFrame>
        );
    }

    return (
        <PageFrame>
            <AccountForm />
        </PageFrame>
    );
}

function PageFrame({ children }: { children: ReactNode }) {
    return <div className="flex min-h-[70dvh] items-center justify-center px-4">{children}</div>;
}

function AccountForm() {
    const session = useSession();
    const [mode, setMode] = useState<AccountFormMode>(AccountFormMode.SIGN_IN);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const copy = MODE_COPY[mode];

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);
        try {
            const credentials = { email: email.trim(), password };
            await (mode === AccountFormMode.SIGN_IN
                ? session.signIn(credentials)
                : session.signUp(credentials));
        } catch (error) {
            // The kit hands back an ApiError, whose message the server wrote for
            // a person to read — "Invalid email or password" says more than
            // anything this page could invent.
            setErrorMessage((error as ApiError).message || UNEXPECTED_FAILURE_MESSAGE);
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchMode = () => {
        setMode(mode === AccountFormMode.SIGN_IN ? AccountFormMode.SIGN_UP : AccountFormMode.SIGN_IN);
        setErrorMessage('');
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>{copy.title}</CardTitle>
                <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete={
                                mode === AccountFormMode.SIGN_IN ? 'current-password' : 'new-password'
                            }
                            required
                        />
                    </div>

                    {errorMessage && (
                        <p role="alert" className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    )}

                    <AppButton type="submit" isActive isDisabled={isSubmitting}>
                        {isSubmitting ? 'One moment...' : copy.submitLabel}
                    </AppButton>
                </form>

                <button
                    type="button"
                    onClick={switchMode}
                    className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
                >
                    {copy.switchLabel}
                </button>
            </CardContent>
        </Card>
    );
}
