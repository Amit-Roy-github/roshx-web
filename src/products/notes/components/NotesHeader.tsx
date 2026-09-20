import { ThemeToggle, useTheme } from '@roshx/ui';

interface NotesHeaderProps {
    onOpenHelp: () => void;
}

/**
 * The identity and page-wide controls belong to the folders pane. That keeps
 * the editor clear of a second header while remaining available at all times.
 */
export function NotesHeader({ onOpenHelp }: NotesHeaderProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-notes-line px-3">
            <span className="text-sm font-semibold text-notes-ink">
                Roshx<span className="text-notes-accent">Notes</span>
            </span>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    title="Keyboard shortcuts (?)"
                    onClick={onOpenHelp}
                    className="rounded px-1.5 py-0.5 font-mono text-xs text-notes-ink-faint transition-colors hover:bg-notes-line hover:text-notes-ink"
                >
                    ?
                </button>
                <ThemeToggle theme={theme} onToggle={toggleTheme} className="h-7 w-7 rounded-md" />
            </div>
        </header>
    );
}
