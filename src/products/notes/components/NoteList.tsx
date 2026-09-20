import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@roshx/ui';
import type { Note } from '@/products/notes/note.types';

const EMPTY_LIST_MESSAGE = 'No notes yet — add your first one.';

/** The body is markup; a preview line wants the words out of it. */
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

interface NoteListProps {
    notes: Note[];
    selectedNoteId: string | null;
    onSelect: (note: Note) => void;
}

export function NoteList({ notes, selectedNoteId, onSelect }: NoteListProps) {
    const listRef = useRef<HTMLDivElement>(null);

    // Tab walks the list one note at a time and opens each as it lands on it,
    // rather than only moving focus. At the ends nothing is prevented, so Tab
    // falls through to the rest of the page.
    const selectNextOnTab = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Tab') {
            return;
        }
        const currentIndex = notes.findIndex((note) => note.id === selectedNoteId);
        if (currentIndex === -1) {
            return;
        }
        const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
        const nextNote = notes[nextIndex];
        if (!nextNote) {
            return;
        }
        event.preventDefault();
        onSelect(nextNote);
        listRef.current?.querySelectorAll<HTMLElement>('button')[nextIndex]?.focus();
    };

    if (notes.length === 0) {
        return <p className="text-sm text-notes-ink-faint">{EMPTY_LIST_MESSAGE}</p>;
    }

    return (
        // Buttons rather than a radiogroup. A radiogroup is one tab stop with
        // arrow keys inside it, which the original then undid by hand so Tab
        // could walk the notes one at a time — buttons do that on their own.
        <div ref={listRef} onKeyDown={selectNextOnTab} className="flex flex-col gap-2">
            {notes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                return (
                    <button
                        key={note.id}
                        type="button"
                        onClick={() => onSelect(note)}
                        aria-current={isSelected}
                        className={cn(
                            'flex w-full items-start justify-between gap-2 rounded-md border border-notes-line px-3 py-2.5 text-left outline-none transition-colors hover:border-notes-line-strong focus-visible:ring-2 focus-visible:ring-notes-accent-strong',
                            isSelected && 'border-notes-accent-strong bg-notes-accent-strong/10',
                        )}
                    >
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium text-notes-ink">
                                {note.title || 'Untitled'}
                            </h3>
                            <p className="mt-0.5 truncate text-xs text-notes-ink-muted">
                                {stripHtml(note.content) || 'No content'}
                            </p>
                            <span className="mt-1 block text-[11px] text-notes-ink-faint">
                                {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <span
                            className={cn(
                                'mt-1 flex size-3 shrink-0 items-center justify-center rounded-full border border-notes-line-strong',
                                isSelected && 'border-notes-accent',
                            )}
                        >
                            {isSelected && <span className="size-1.5 rounded-full bg-notes-accent" />}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
