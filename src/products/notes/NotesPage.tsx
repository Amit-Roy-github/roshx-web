import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
 * Notes: folders and the notes inside them on the left, one editor on the right.
 *
 * Everything is derived from two queries, so a note changing folders or a folder
 * being deleted needs no local bookkeeping — the lists are refetched and the
 * page renders whatever the server now says.
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

    return (
        <main className="flex flex-1 overflow-hidden bg-notes-app">
            <div className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-r border-notes-line bg-notes-surface px-3 py-8">
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
                <NoteList
                    notes={visibleNotes}
                    selectedNoteId={editingNote?.id ?? null}
                    onSelect={setEditingNote}
                />
            </div>

            <div className="flex-auto overflow-y-auto p-2">
                <div className="mb-8">
                    <NoteForm
                        editingNote={editingNote}
                        directories={directories}
                        defaultFolderId={defaultFolderId}
                        onSubmit={(input) => saveNote.mutateAsync(input).then(() => undefined)}
                        onCancelEdit={() => setEditingNote(null)}
                        onDelete={(id) => removeNote.mutateAsync(id)}
                    />
                </div>

                {notesQuery.isError && <p className="mb-4 text-notes-danger">Could not load your notes.</p>}
            </div>
        </main>
    );
}
