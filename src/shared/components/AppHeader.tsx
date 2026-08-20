import { Theme } from '@/shared/enums/theme.enum';

interface AppHeaderProps {
    theme: Theme;
    onToggleTheme: () => void;
}

/** Wordmark on the left, theme switch on the right. Deliberately nothing else. */
export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
    const isDark = theme === Theme.DARK;
    return (
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
            <span className="text-lg font-semibold tracking-tight">
                Roshx<span style={{ color: 'var(--accent)' }}>Typing</span>
            </span>
            <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="grid h-9 w-9 place-items-center rounded-lg border transition-colors"
                style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--surface-control)',
                    color: 'var(--text-muted)',
                }}
            >
                {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
        </header>
    );
}

function SunIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4.5" />
            <path
                strokeLinecap="round"
                d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinejoin="round" d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
        </svg>
    );
}
