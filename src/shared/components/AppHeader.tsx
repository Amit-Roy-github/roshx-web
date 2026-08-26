import { NavLink } from 'react-router-dom';
import type { Theme } from '@roshx/core';
import { cn, ThemeToggle } from '@roshx/ui';
import { useSession } from '@/shared/auth/useSession';
import { RoutePath } from '@/routes/routePaths';

/** Admin is missing on purpose — it is reached by URL, not by browsing. */
const PRODUCT_LINKS: { path: RoutePath; label: string }[] = [
    { path: RoutePath.PRACTICE, label: 'Practice' },
    { path: RoutePath.NOTES, label: 'Notes' },
];

interface AppHeaderProps {
    theme: Theme;
    onToggleTheme: () => void;
}

/** Wordmark, the products behind it, and who is signed in. */
export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
    const session = useSession();

    return (
        <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
            <div className="flex items-center gap-6">
                <NavLink to={RoutePath.HOME} className="text-lg font-semibold tracking-tight">
                    Rosh<span className="text-primary">x</span>
                </NavLink>
                <nav className="flex items-center gap-4">
                    {PRODUCT_LINKS.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                cn(
                                    'text-sm transition-colors',
                                    isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <NavLink
                    to={RoutePath.HOME}
                    className="max-w-[12rem] truncate text-sm text-muted-foreground hover:text-foreground"
                >
                    {session.user ? session.user.email : 'Sign in'}
                </NavLink>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
        </header>
    );
}
