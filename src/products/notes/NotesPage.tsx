import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@roshx/ui';
import { Clock3Icon } from 'lucide-react';
import { FolderSidebar } from '@/products/notes/components/FolderSidebar';
import { HelpDialog } from '@/products/notes/components/HelpDialog';
import { NotesHeader } from '@/products/notes/components/NotesHeader';
import { isEditableElementFocused, isModifierKeyPressed } from '@/products/notes/keyboard';
import { NoteForm, type NoteFormHandle } from '@/products/notes/editor/NoteForm';
import { NoteList } from '@/products/notes/components/NoteList';
import { SpecialFolder } from '@/products/notes/specialFolder.enum';
import {
    createDirectory,
    createNote,
    deleteDirectory,
    deleteNote,
    fetchDirectories,
    fetchNotes,
    renameDirectory,
    updateNote,
} from '@/products/notes/notesApi';
import type { CreateNoteInput, Note } from '@/products/notes/note.types';
import { useSession } from '@/shared/auth/useSession';

const NOTES_QUERY_KEY = ['notes'];
const DIRECTORIES_QUERY_KEY = ['directories'];

/**
 * Notes is a three-pane workspace: folders, the active editor, and files.
 *
 * Everything is derived from two queries, so a note changing folders or a folder
 * being deleted needs no local bookkeeping — the lists are refetched and the
 * page renders whatever the server now says.
 */
export function NotesPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { isSignedIn } = useSession();
    const [selectedFolder, setSelectedFolder] = useState<string>(SpecialFolder.ALL);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const noteFormRef = useRef<NoteFormHandle>(null);

    const notesQuery = useQuery({ queryKey: NOTES_QUERY_KEY, queryFn: fetchNotes });
    const directoriesQuery = useQuery({ queryKey: DIRECTORIES_QUERY_KEY, queryFn: fetchDirectories });

    const notes = notesQuery.data ?? [];
    const directories = directoriesQuery.data ?? [];

    const refreshNotes = () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    const refreshDirectories = () => queryClient.invalidateQueries({ queryKey: DIRECTORIES_QUERY_KEY });

    const saveNote = useMutation({
        mutationFn: (input: CreateNoteInput) =>
            editingNote ? updateNote(editingNote.id, input) : createNote(input),
        onSuccess: async (savedNote) => {
            // The original keeps editing the note it just saved, and drops back
            // to a blank form only after a create.
            setEditingNote(editingNote ? savedNote : null);
            await refreshNotes();
        },
    });

    const removeNote = useMutation({
        mutationFn: deleteNote,
        onSuccess: async () => {
            setEditingNote(null);
            await refreshNotes();
        },
    });

    const addFolder = useMutation({
        mutationFn: (name: string) => createDirectory({ name }),
        onSuccess: refreshDirectories,
    });

    const renameFolder = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => renameDirectory(id, name),
        onSuccess: refreshDirectories,
    });

    const removeFolder = useMutation({
        mutationFn: deleteDirectory,
        onSuccess: async (_result, deletedFolderId) => {
            // Its notes stay, now uncategorised, so the note list changes too —
            // and the page would still be filtered by a folder that is gone.
            if (selectedFolder === deletedFolderId) {
                setSelectedFolder(SpecialFolder.ALL);
            }
            await Promise.all([refreshDirectories(), refreshNotes()]);
        },
    });

    const visibleNotes = notes.filter((note) => {
        if (selectedFolder === SpecialFolder.ALL) {
            return true;
        }
        if (selectedFolder === SpecialFolder.UNCATEGORIZED) {
            return note.folderId === null;
        }
        return note.folderId === selectedFolder;
    });

    // A note written while a real folder is open belongs in it — anything else
    // makes the reader move it by hand straight after writing it.
    const defaultFolderId =
        selectedFolder === SpecialFolder.ALL || selectedFolder === SpecialFolder.UNCATEGORIZED
            ? null
            : selectedFolder;

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const isModifierPressed = isModifierKeyPressed(event);
            const isTyping = isEditableElementFocused();

            if (event.key === 'Escape' && isTyping) {
                (document.activeElement as HTMLElement).blur();
                return;
            }
            if (isModifierPressed && event.key === 'Enter') {
                event.preventDefault();
                noteFormRef.current?.requestSubmit();
                return;
            }
            // event.code, not event.key: on macOS Option+N is a dead key for
            // composing "ñ", so with Alt held the key arrives as "Dead".
            if (isModifierPressed && event.altKey && event.code === 'KeyN') {
                event.preventDefault();
                setEditingNote(null);
                noteFormRef.current?.focusTitle();
                return;
            }
            if (
                isModifierPressed &&
                (event.key === 'Backspace' || event.key === 'Delete') &&
                editingNote &&
                !isTyping
            ) {
                event.preventDefault();
                void removeNote.mutateAsync(editingNote.id);
                return;
            }
            if (!isModifierPressed && event.key === '/' && !isTyping) {
                event.preventDefault();
                noteFormRef.current?.focusTitle();
                return;
            }
            if (isModifierPressed && event.key === '/') {
                event.preventDefault();
                noteFormRef.current?.focusContent();
                return;
            }
            if ((isModifierPressed && event.key.toLowerCase() === 'h') || (!isTyping && event.key === '?')) {
                event.preventDefault();
                setIsHelpOpen(true);
            }
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, [editingNote, removeNote]);

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-notes-app">
            <aside className="flex w-60 shrink-0 flex-col border-r border-notes-line bg-notes-surface">
                <NotesHeader onOpenHelp={() => setIsHelpOpen(true)} />
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
                    <FolderSidebar
                        directories={directories}
                        notes={notes}
                        selectedFolder={selectedFolder}
                        onSelectFolder={setSelectedFolder}
                        onCreateFolder={(name) => addFolder.mutateAsync(name).then(() => undefined)}
                        onRenameFolder={(id, name) =>
                            renameFolder.mutateAsync({ id, name }).then(() => undefined)
                        }
                        onDeleteFolder={(id) => removeFolder.mutateAsync(id).then(() => undefined)}
                    />
                </div>
                {!isSignedIn && (
                    <div className="shrink-0 px-3 pb-4">
                        <div className="relative rounded-xl bg-amber-100 px-3 py-3 text-amber-900 dark:bg-stone-800 dark:text-stone-100">
                            <div className="relative flex items-center gap-1.5">
                                <Clock3Icon
                                    aria-hidden="true"
                                    className="size-4 text-amber-600 dark:text-amber-300"
                                />
                                <p className="text-sm font-semibold">Not signed in</p>
                                <Button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    variant="ghost"
                                    size="xs"
                                    className="absolute right-0 h-auto px-0 py-0 text-xs font-semibold text-amber-900 underline decoration-amber-400 underline-offset-4 hover:bg-transparent hover:text-amber-700 dark:text-amber-200 dark:decoration-amber-500 dark:hover:bg-transparent dark:hover:text-amber-100"
                                >
                                    Sign in
                                </Button>
                            </div>
                            <p className="mt-1.5 text-xs leading-4 text-amber-800 dark:text-stone-300">
                                Your notes are kept for 7 days only.
                            </p>
                        </div>
                    </div>
                )}
            </aside>

            <section className="flex min-w-0 flex-1 flex-col overflow-hidden overscroll-none">
                <div className="flex min-h-0 flex-1 flex-col">
                    <NoteForm
                        ref={noteFormRef}
                        editingNote={editingNote}
                        directories={directories}
                        defaultFolderId={defaultFolderId}
                        onSubmit={(input) => saveNote.mutateAsync(input).then(() => undefined)}
                        onCancelEdit={() => setEditingNote(null)}
                        onDelete={(id) => removeNote.mutateAsync(id)}
                    />
                </div>

                {notesQuery.isError && <p className="m-4 text-notes-danger">Could not load your notes.</p>}
            </section>

            <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-notes-line bg-notes-surface">
                <div className="shrink-0 border-b border-notes-line-faint px-4 py-4">
                    <h2 className="text-xs font-semibold tracking-wide text-notes-ink-faint uppercase">
                        Files
                    </h2>
                </div>
                <div className="overflow-y-auto p-3">
                    <NoteList
                        notes={visibleNotes}
                        selectedNoteId={editingNote?.id ?? null}
                        onSelect={setEditingNote}
                    />
                </div>
            </aside>

            <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
    );
}
