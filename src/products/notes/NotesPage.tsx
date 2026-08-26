import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@roshx/ui';
import { FolderSidebar } from '@/products/notes/FolderSidebar';
import { NoteForm } from '@/products/notes/NoteForm';
import { NoteList } from '@/products/notes/NoteList';
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

const NOTES_QUERY_KEY = ['notes'];
const DIRECTORIES_QUERY_KEY = ['directories'];

/**
 * Notes: a folder list, the notes in the chosen folder, and one editor.
 *
 * Everything on this page is derived from two queries, so a note moving folders
 * or a folder being deleted needs no local bookkeeping — the lists are refetched
 * and the page renders whatever the server now says.
 */
export function NotesPage() {
    const queryClient = useQueryClient();
    const [selectedFolder, setSelectedFolder] = useState<string>(SpecialFolder.ALL);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    const notesQuery = useQuery({ queryKey: NOTES_QUERY_KEY, queryFn: fetchNotes });
    const directoriesQuery = useQuery({ queryKey: DIRECTORIES_QUERY_KEY, queryFn: fetchDirectories });

    const notes = notesQuery.data ?? [];
    const directories = directoriesQuery.data ?? [];

    const refreshNotes = () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    const refreshDirectories = () => queryClient.invalidateQueries({ queryKey: DIRECTORIES_QUERY_KEY });

    const saveNote = useMutation({
        mutationFn: (input: CreateNoteInput) =>
            editingNote ? updateNote(editingNote.id, input) : createNote(input),
        onSuccess: async () => {
            setEditingNote(null);
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
        onSuccess: async () => {
            // Deleting a folder leaves its notes behind as uncategorised, so the
            // note list changes too — and the page would still be filtered by a
            // folder that no longer exists.
            setSelectedFolder(SpecialFolder.ALL);
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

    // A note added while a real folder is open belongs in it — anything else
    // makes the reader move it by hand straight after writing it.
    const defaultFolderId =
        selectedFolder === SpecialFolder.ALL || selectedFolder === SpecialFolder.UNCATEGORIZED
            ? null
            : selectedFolder;

    if (notesQuery.isPending || directoriesQuery.isPending) {
        return (
            <div className="flex min-h-[60dvh] items-center justify-center">
                <Spinner label="Loading your notes" />
            </div>
        );
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[14rem_minmax(0,1fr)_20rem]">
            <aside>
                <FolderSidebar
                    directories={directories}
                    notes={notes}
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                    onCreateFolder={(name) => addFolder.mutateAsync(name).then(() => undefined)}
                    onRenameFolder={(id, name) =>
                        renameFolder.mutateAsync({ id, name }).then(() => undefined)
                    }
                    onDeleteFolder={(id) => removeFolder.mutateAsync(id)}
                />
            </aside>

            <section>
                <NoteForm
                    editingNote={editingNote}
                    directories={directories}
                    defaultFolderId={defaultFolderId}
                    onSubmit={(input) => saveNote.mutateAsync(input).then(() => undefined)}
                    onCancelEdit={() => setEditingNote(null)}
                    onDelete={(id) => removeNote.mutateAsync(id)}
                />
            </section>

            <section>
                <NoteList
                    notes={visibleNotes}
                    selectedNoteId={editingNote?.id ?? null}
                    onSelect={setEditingNote}
                />
            </section>
        </div>
    );
}
