import { ThemeToggle, useTheme } from '@roshx/ui';

interface NotesHeaderProps {
    onOpenHelp: () => void;
}

/**
 * Notes keeps its own header bar.
 *
 * A short bordered strip on the same surface as the sidebar, which is what the
 * page was built around — the site's taller, borderless header left the panes
 * floating under a band of a different colour. The help button belongs here
 * too, and it is a notes thing, so a shared header would have to know about it.
 */
export function NotesHeader({ onOpenHelp }: NotesHeaderProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-notes-line bg-notes-surface px-4">
            <span className="text-sm font-semibold text-notes-ink">
                Roshx<span className="text-notes-accent">Notes</span>
            </span>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    title="Keyboard shortcuts (?)"
                    onClick={onOpenHelp}
                    className="rounded px-2 py-1 font-mono text-xs text-notes-ink-faint transition-colors hover:bg-notes-line hover:text-notes-ink"
                >
                    ?
                </button>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
        </header>
    );
}
