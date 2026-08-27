import { useRef, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@roshx/ui';
import { FADE_SLIDE_MOTION } from '@/products/notes/fadeMotion';
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
        <div ref={listRef} onKeyDown={selectNextOnTab} className="flex flex-col gap-3">
            {/* A note added or deleted elsewhere on the page slides in and out
                rather than appearing; AnimatePresence is what keeps a removed
                note mounted long enough to play its exit. */}
            <AnimatePresence initial={false}>
                {notes.map((note) => {
                    const isSelected = note.id === selectedNoteId;
                    return (
                        <motion.div key={note.id} layout {...FADE_SLIDE_MOTION}>
                            <button
                                type="button"
                                onClick={() => onSelect(note)}
                                aria-current={isSelected}
                                className={cn(
                                    'group flex w-full items-start justify-between gap-3 rounded-xl border border-notes-line p-4 text-left transition-colors outline-none hover:border-notes-line-strong focus-visible:ring-2 focus-visible:ring-notes-accent-strong',
                                    isSelected && 'border-notes-accent-strong bg-notes-accent-strong/10',
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-semibold text-notes-ink">{note.title}</h3>
                                    <p className="mt-1 truncate text-sm text-notes-ink-muted">
                                        {stripHtml(note.content)}
                                    </p>
                                    <span className="mt-1 block text-xs text-notes-ink-faint">
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <span
                                    className={cn(
                                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-notes-line-strong',
                                        isSelected && 'border-notes-accent',
                                    )}
                                >
                                    {isSelected && <span className="size-2 rounded-full bg-notes-accent" />}
                                </span>
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
