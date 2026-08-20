import type { ReactNode } from 'react';

interface ActionButtonProps {
    children: ReactNode;
    onClick: () => void;
    isActive?: boolean;
    isDisabled?: boolean;
}

/**
 * The only button style in the app.
 *
 * `isActive` is what makes "Generate test" visibly the thing you are doing —
 * the window and the button change together, so the mode is never ambiguous.
 */
export function ActionButton({ children, onClick, isActive = false, isDisabled = false }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45"
            style={{
                backgroundColor: isActive ? 'var(--accent)' : 'var(--surface-control)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border-subtle)',
                color: isActive ? 'var(--accent-contrast)' : 'var(--text-primary)',
            }}
        >
            {children}
        </button>
    );
}
