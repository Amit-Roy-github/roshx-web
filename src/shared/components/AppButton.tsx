import type { ReactNode } from 'react';
import { Button } from '@roshx/ui';

interface AppButtonProps {
    children: ReactNode;
    onClick: () => void;
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
export function AppButton({ children, onClick, isActive = false, isDisabled = false }: AppButtonProps) {
    return (
        <Button
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
