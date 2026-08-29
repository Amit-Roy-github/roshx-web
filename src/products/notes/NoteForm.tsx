import {
    Suspense,
    lazy,
    useCallback,
    useImperativeHandle,
    useRef,
    useState,
    type FormEvent,
    type Ref,
} from 'react';
import { cn } from '@roshx/ui';
import { AiEditBox } from '@/products/notes/AiEditBox';
import { MODIFIER_KEY_LABEL } from '@/products/notes/keyboard';
import { editNoteWithAi } from '@/products/notes/notesApi';
import { TOOLBAR_GROUPS, type NoteEditorHandle } from '@/products/notes/noteToolbar';
import type { CreateNoteInput, Directory, Note } from '@/products/notes/note.types';

// Tiptap and its extensions are the heaviest thing this app loads and are not
// needed for first paint, so they are split into their own chunk instead of
// sitting on the path that blocks the page becoming interactive.
const NoteEditor = lazy(() =>
    import('@/products/notes/NoteEditor').then((module) => ({ default: module.NoteEditor })),
);

const UNCATEGORIZED_OPTION_VALUE = '';
const EMPTY_CONTENT_MESSAGE = 'Likho kuch toh sahi.';
const AI_EDIT_FAILED_MESSAGE = 'AI could not edit this note right now.';

const toolbarButtonClass = (isActive: boolean) =>
    cn(
        'rounded-md px-2 py-1 font-mono text-[11px] leading-none text-notes-ink-faint transition-colors hover:bg-notes-line-faint hover:text-notes-ink',
        isActive &&
            'bg-notes-accent-strong/10 text-notes-accent hover:bg-notes-accent-strong/15 hover:text-notes-accent',
    );

/** Tiptap always returns markup, so emptiness is a question about the text inside it. */
function isHtmlEmpty(html: string): boolean {
    return html.replace(/<[^>]*>/g, '').trim().length === 0;
}

/** What the page's keyboard shortcuts need to reach inside the form. */
export interface NoteFormHandle {
    requestSubmit: () => void;
    focusTitle: () => void;
    focusContent: () => void;
}

interface NoteFormProps {
    ref?: Ref<NoteFormHandle>;
    editingNote: Note | null;
    directories: Directory[];
    defaultFolderId: string | null;
    onSubmit: (input: CreateNoteInput) => Promise<void>;
    onCancelEdit: () => void;
    onDelete: (id: string) => Promise<void>;
}

export function NoteForm({
    ref,
    editingNote,
    directories,
    defaultFolderId,
    onSubmit,
    onCancelEdit,
    onDelete,
}: NoteFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(editingNote?.title ?? '');
    const [content, setContent] = useState(editingNote?.content ?? '');
    const [folderId, setFolderId] = useState<string | null>(editingNote?.folderId ?? defaultFolderId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showContentError, setShowContentError] = useState(false);
    const [editorHandle, setEditorHandle] = useState<NoteEditorHandle | null>(null);
    const [isAiBoxOpen, setIsAiBoxOpen] = useState(false);
    const [isAiEditing, setIsAiEditing] = useState(false);
    const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

    // Bumped after every successful create, so the key below changes even though
    // editingNote stays null across back-to-back new notes. Without it the
    // editor never remounts and keeps the last note's markup.
    const [newNoteResetCount, setNewNoteResetCount] = useState(0);
    const editorKey = editingNote?.id ?? `new-${newNoteResetCount}`;

    // Picking a different note loads it. Done while rendering rather than in an
    // effect so the fields never paint with the previous note's text first.
    // Keyed on the note alone: changing folders moves defaultFolderId too, and
    // resetting on that would wipe a half-written note.
    const editingNoteId = editingNote?.id ?? null;
    const [loadedNoteId, setLoadedNoteId] = useState(editingNoteId);
    if (loadedNoteId !== editingNoteId) {
        setLoadedNoteId(editingNoteId);
        setTitle(editingNote?.title ?? '');
        setContent(editingNote?.content ?? '');
        setFolderId(editingNote?.folderId ?? defaultFolderId);
        setShowContentError(false);
    }

    // Stable, because the editor re-publishes its handle on every transaction
    // and a new function here would tear that subscription down each time.
    const handleEditorHandleChange = useCallback((handle: NoteEditorHandle) => setEditorHandle(handle), []);

    useImperativeHandle(
        ref,
        () => ({
            requestSubmit: () => formRef.current?.requestSubmit(),
            focusTitle: () => {
                const titleInput = titleInputRef.current;
                titleInput?.focus();
                // Caret at the end, not selecting what is already there — the
                // shortcut is for carrying on, not for starting over.
                titleInput?.setSelectionRange(titleInput.value.length, titleInput.value.length);
            },
            focusContent: () => editorHandle?.focusEnd(),
        }),
        [editorHandle],
    );

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

    // Whatever is in the form right now — saved or not — goes to the model,
    // and the answer replaces it in place. Save is still the author's call.
    const handleAiEdit = async (instruction: string) => {
        setIsAiEditing(true);
        setAiErrorMessage(null);
        try {
            const editedNote = await editNoteWithAi({ title, content, instruction });
            setTitle(editedNote.title);
            setContent(editedNote.content);
            editorHandle?.setContent(editedNote.content);
        } catch {
            setAiErrorMessage(AI_EDIT_FAILED_MESSAGE);
        } finally {
            setIsAiEditing(false);
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
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex flex-col rounded-sm border border-notes-line"
        >
            <input
                ref={titleInputRef}
                type="text"
                placeholder="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="rounded-lg px-3 py-2 text-notes-ink placeholder-notes-ink-faint outline-none"
            />

            <div className="px-4 py-4">
                <Suspense
                    fallback={<div className="min-h-[8rem] animate-pulse rounded-md bg-notes-line-faint" />}
                >
                    <NoteEditor
                        key={editorKey}
                        initialContent={editingNote?.content ?? ''}
                        onChange={(html) => {
                            setContent(html);
                            if (showContentError && !isHtmlEmpty(html)) {
                                setShowContentError(false);
                            }
                        }}
                        onHandleChange={handleEditorHandleChange}
                    />
                </Suspense>
                {showContentError && (
                    <p className="mt-2 text-xs text-notes-danger">{EMPTY_CONTENT_MESSAGE}</p>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-notes-line-faint px-4 pt-3 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                    {TOOLBAR_GROUPS.map((group) => (
                        <div key={group[0]?.name} className="flex items-center gap-0.5">
                            {group.map((action) => (
                                <button
                                    key={action.name}
                                    type="button"
                                    title={`${action.title} (${MODIFIER_KEY_LABEL}+${action.shortcut})`}
                                    onClick={() => editorHandle?.toggle(action.name)}
                                    className={toolbarButtonClass(
                                        editorHandle?.activeNames.includes(action.name) ?? false,
                                    )}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    ))}

                    <select
                        value={folderId ?? UNCATEGORIZED_OPTION_VALUE}
                        onChange={(event) => setFolderId(event.target.value || null)}
                        title="Folder"
                        className="rounded-md border border-notes-line bg-notes-surface px-2 py-1 text-xs text-notes-ink-muted outline-none transition-colors hover:text-notes-ink focus:border-notes-accent"
                    >
                        <option value={UNCATEGORIZED_OPTION_VALUE}>Uncategorized</option>
                        {directories.map((directory) => (
                            <option key={directory.id} value={directory.id}>
                                {directory.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAiBoxOpen((isOpen) => !isOpen)}
                        title="Edit this note with AI"
                        className={toolbarButtonClass(isAiBoxOpen)}
                    >
                        ✦ AI
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-notes-accent-strong px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-notes-accent focus-visible:ring-2 focus-visible:ring-notes-accent-strong/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? (editingNote ? 'Saving…' : 'Adding…') : editingNote ? 'Save' : 'Add'}
                    </button>
                    {editingNote && (
                        <>
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-notes-ink-muted transition-colors hover:bg-notes-line hover:text-notes-ink focus-visible:ring-2 focus-visible:ring-notes-line-strong focus-visible:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDelete()}
                                disabled={isDeleting}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-notes-danger transition-colors hover:bg-notes-danger/10 focus-visible:ring-2 focus-visible:ring-notes-danger/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <AiEditBox
                isOpen={isAiBoxOpen}
                isBusy={isAiEditing}
                errorMessage={aiErrorMessage}
                onSubmit={handleAiEdit}
                onClose={() => setIsAiBoxOpen(false)}
            />
        </form>
    );
}
