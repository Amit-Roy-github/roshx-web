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
    if (notes.length === 0) {
        return <p className="text-sm text-muted-foreground">{EMPTY_LIST_MESSAGE}</p>;
    }

    return (
        // Plain buttons rather than a radiogroup. A radiogroup is one tab stop
        // with arrow keys inside it, which the Svelte version then had to undo
        // by hand so Tab could walk the notes one at a time; buttons do that on
        // their own.
        <ul className="flex flex-col gap-2">
            {notes.map((note) => (
                <li key={note.id}>
                    <button
                        type="button"
                        onClick={() => onSelect(note)}
                        aria-current={note.id === selectedNoteId}
                        className={cn(
                            'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                            note.id === selectedNoteId ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                        )}
                    >
                        <h3 className="truncate font-semibold">{note.title}</h3>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                            {stripHtml(note.content)}
                        </p>
                        <span className="mt-1 block text-xs text-muted-foreground">
                            {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
