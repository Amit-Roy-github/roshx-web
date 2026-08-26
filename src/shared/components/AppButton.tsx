import type { ReactNode } from 'react';
import { Button } from '@roshx/ui';

interface AppButtonProps {
    children: ReactNode;
    /** Omitted by a submit button, whose form owns what happens. */
    onClick?: () => void;
    /** 'submit' so Enter works in a form, which is how people finish typing one. */
    type?: 'button' | 'submit';
    isActive?: boolean;
    isDisabled?: boolean;
}

/**
 * The only button style in the app, on top of the shared kit.
 *
 * Wraps shadcn's Button rather than restyling it: this app speaks in "is this
 * the thing you are doing right now", and shadcn speaks in variants.
 * Translating once here keeps every call site free of that decision.
 */
export function AppButton({
    children,
    onClick,
    type = 'button',
    isActive = false,
    isDisabled = false,
}: AppButtonProps) {
    return (
        <Button
            type={type}
            variant={isActive ? 'default' : 'outline'}
            size="lg"
            onClick={onClick}
            disabled={isDisabled}
            className="rounded-xl text-sm"
        >
            {children}
        </Button>
    );
}
