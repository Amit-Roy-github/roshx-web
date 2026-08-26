import { Suspense, lazy, useState, type FormEvent } from 'react';
import { Input, Skeleton } from '@roshx/ui';
import { AppButton } from '@/shared/components/AppButton';
import type { CreateNoteInput, Directory, Note } from '@/products/notes/note.types';

// Tiptap and its extensions are the heaviest thing this app loads, and nobody
// needs them to read a list of notes. Split out so the first paint does not
// wait for an editor that may never be typed in.
const NoteEditor = lazy(() =>
    import('@/products/notes/NoteEditor').then((module) => ({ default: module.NoteEditor })),
);

const UNCATEGORIZED_OPTION_VALUE = '';
const EMPTY_CONTENT_MESSAGE = 'Write something first.';

/** Tiptap always returns markup, so emptiness is a question about the text inside it. */
function isHtmlEmpty(html: string): boolean {
    return html.replace(/<[^>]*>/g, '').trim().length === 0;
}

interface NoteFormProps {
    editingNote: Note | null;
    directories: Directory[];
    defaultFolderId: string | null;
    onSubmit: (input: CreateNoteInput) => Promise<void>;
    onCancelEdit: () => void;
    onDelete: (id: string) => Promise<void>;
}

export function NoteForm({
    editingNote,
    directories,
    defaultFolderId,
    onSubmit,
    onCancelEdit,
    onDelete,
}: NoteFormProps) {
    const [title, setTitle] = useState(editingNote?.title ?? '');
    const [content, setContent] = useState(editingNote?.content ?? '');
    const [folderId, setFolderId] = useState<string | null>(editingNote?.folderId ?? defaultFolderId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showContentError, setShowContentError] = useState(false);

    // Bumped after every successful create, so the key below changes even though
    // editingNote stays null across back-to-back new notes. Without it the
    // editor never remounts and keeps the last note's markup.
    const [newNoteResetCount, setNewNoteResetCount] = useState(0);
    const editorKey = editingNote?.id ?? `new-${newNoteResetCount}`;

    // Picking a different note loads it. Done while rendering rather than in an
    // effect so the fields never paint with the previous note's text first.
    //
    // Keyed on the note alone, deliberately: changing folders in the sidebar
    // moves defaultFolderId too, and resetting on that would wipe a half-written
    // note the moment somebody clicked another folder to look at it.
    const editingNoteId = editingNote?.id ?? null;
    const [loadedNoteId, setLoadedNoteId] = useState(editingNoteId);
    if (loadedNoteId !== editingNoteId) {
        setLoadedNoteId(editingNoteId);
        setTitle(editingNote?.title ?? '');
        setContent(editingNote?.content ?? '');
        setFolderId(editingNote?.folderId ?? defaultFolderId);
        setShowContentError(false);
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isHtmlEmpty(content)) {
            setShowContentError(true);
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({ title, content, folderId });
            if (!editingNote) {
                setTitle('');
                setContent('');
                setNewNoteResetCount((count) => count + 1);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingNote) {
            return;
        }
        setIsDeleting(true);
        try {
            await onDelete(editingNote.id);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border p-4">
            <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                required
                className="border-none px-0 text-base shadow-none focus-visible:ring-0"
            />

            <div>
                <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                    <NoteEditor
                        key={editorKey}
                        initialContent={editingNote?.content ?? ''}
                        onChange={(html) => {
                            setContent(html);
                            if (showContentError && !isHtmlEmpty(html)) {
                                setShowContentError(false);
                            }
                        }}
                    />
                </Suspense>
                {showContentError && <p className="mt-2 text-xs text-destructive">{EMPTY_CONTENT_MESSAGE}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <select
                    value={folderId ?? UNCATEGORIZED_OPTION_VALUE}
                    onChange={(event) => setFolderId(event.target.value || null)}
                    title="Folder"
                    className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground outline-none hover:text-foreground focus:border-primary"
                >
                    <option value={UNCATEGORIZED_OPTION_VALUE}>Uncategorized</option>
                    {directories.map((directory) => (
                        <option key={directory.id} value={directory.id}>
                            {directory.name}
                        </option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    <AppButton type="submit" isActive isDisabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : editingNote ? 'Save' : 'Add'}
                    </AppButton>
                    {editingNote && (
                        <>
                            <AppButton onClick={onCancelEdit}>Cancel</AppButton>
                            <AppButton onClick={() => void handleDelete()} isDisabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </AppButton>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
}
