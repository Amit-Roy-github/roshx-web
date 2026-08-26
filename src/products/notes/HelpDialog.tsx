import { useEffect } from 'react';
import { MODIFIER_KEY_LABEL } from '@/products/notes/keyboard';

interface Shortcut {
    keys: string[];
    description: string;
}

const NOTE_SHORTCUTS: Shortcut[] = [
    { keys: [MODIFIER_KEY_LABEL, 'Alt', 'N'], description: 'Start a new note' },
    { keys: [MODIFIER_KEY_LABEL, 'Enter'], description: 'Save the current note' },
    { keys: [MODIFIER_KEY_LABEL, 'Delete'], description: 'Delete the current note (not while typing)' },
    { keys: ['/'], description: 'Focus the title (not while typing)' },
    { keys: [MODIFIER_KEY_LABEL, '/'], description: 'Focus the note content' },
    {
        keys: [MODIFIER_KEY_LABEL, 'H'],
        description: 'Show this help (may be reserved by your browser/OS)',
    },
    { keys: ['?'], description: 'Show this help (not while typing)' },
];

const FORMATTING_SHORTCUTS: Shortcut[] = [
    { keys: [MODIFIER_KEY_LABEL, 'B'], description: 'Bold' },
    { keys: [MODIFIER_KEY_LABEL, 'I'], description: 'Italic' },
    { keys: [MODIFIER_KEY_LABEL, 'E'], description: 'Inline code' },
    { keys: [MODIFIER_KEY_LABEL, 'Shift', '8'], description: 'Bullet list' },
    { keys: [MODIFIER_KEY_LABEL, 'Shift', '7'], description: 'Numbered list' },
    { keys: [MODIFIER_KEY_LABEL, 'Shift', '9'], description: 'Task list' },
    { keys: [MODIFIER_KEY_LABEL, 'Alt', 'C'], description: 'Code block' },
];

interface HelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
                className="relative w-full max-w-3xl rounded-xl border border-notes-line bg-notes-surface p-5 shadow-lg"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-notes-ink">Keyboard shortcuts</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded px-2 py-1 text-xs text-notes-ink-faint transition-colors hover:bg-notes-line hover:text-notes-ink"
                    >
                        Close
                    </button>
                </div>

                <div className="grid grid-cols-2 divide-x divide-notes-line">
                    <div className="pr-10">
                        <h3 className="mb-2 text-xs font-semibold tracking-wide text-notes-ink-faint uppercase">
                            Notes
                        </h3>
                        <ShortcutList shortcuts={NOTE_SHORTCUTS} />
                    </div>
                    <div className="pl-4">
                        <h3 className="mb-2 text-xs font-semibold tracking-wide text-notes-ink-faint uppercase">
                            Formatting
                        </h3>
                        <ShortcutList shortcuts={FORMATTING_SHORTCUTS} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShortcutList({ shortcuts }: { shortcuts: Shortcut[] }) {
    return (
        <ul className="flex flex-col gap-2">
            {shortcuts.map((shortcut) => (
                <li key={shortcut.description} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-notes-ink-muted">{shortcut.description}</span>
                    <span className="flex shrink-0 flex-wrap justify-end gap-1">
                        {shortcut.keys.map((key) => (
                            <kbd
                                key={key}
                                className="rounded border border-notes-line-strong bg-notes-line-faint px-1.5 py-0.5 font-mono text-xs text-notes-ink"
                            >
                                {key}
                            </kbd>
                        ))}
                    </span>
                </li>
            ))}
        </ul>
    );
}
