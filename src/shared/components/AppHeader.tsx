import type { Theme } from '@roshx/core';
import { ThemeToggle } from '@roshx/ui';

interface AppHeaderProps {
    theme: Theme;
    onToggleTheme: () => void;
}

/** Wordmark on the left, theme switch on the right. Deliberately nothing else. */
export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
    return (
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
            <span className="text-lg font-semibold tracking-tight">
                Roshx<span className="text-primary">Typing</span>
            </span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </header>
    );
}
