import { useLocation } from 'react-router-dom';
import type { Theme } from '@roshx/core';
import { ThemeToggle } from '@roshx/ui';
import { RoutePath } from '@/routes/routePaths';

/**
 * The half of the wordmark that names the product you are in.
 *
 * There is no nav, on purpose: the products do not advertise each other yet, so
 * the only thing the header says is where you already are.
 */
const PRODUCT_NAME_BY_PATH: Partial<Record<RoutePath, string>> = {
    [RoutePath.PRACTICE]: 'Typing',
    [RoutePath.NOTES]: 'Notes',
};

interface AppHeaderProps {
    theme: Theme;
    onToggleTheme: () => void;
}

/** Wordmark on the left, theme switch on the right. Deliberately nothing else. */
export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
    const { pathname } = useLocation();
    const productName = PRODUCT_NAME_BY_PATH[pathname as RoutePath] ?? '';

    return (
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
            <span className="text-lg font-semibold tracking-tight">
                Roshx<span className="text-primary">{productName}</span>
            </span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </header>
    );
}
