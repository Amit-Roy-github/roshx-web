import { apiClient } from '@/shared/lib/apiClient';
import type {
    CreateDirectoryInput,
    CreateNoteInput,
    Directory,
    Note,
    UpdateNoteInput,
} from '@/products/notes/note.types';

// Not under a product prefix, unlike practice: released sh-web-notes builds
// have these paths baked in, so they cannot move.
const NOTES_PATH = '/roshx/notes';
const DIRECTORIES_PATH = '/roshx/directories';

export async function fetchNotes(): Promise<Note[]> {
    const response = await apiClient.get<Note[]>(NOTES_PATH);
    return response.data;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
    const response = await apiClient.post<Note>(NOTES_PATH, input);
    return response.data;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
    const response = await apiClient.put<Note>(`${NOTES_PATH}/${id}`, input);
    return response.data;
}

export async function deleteNote(id: string): Promise<void> {
    await apiClient.delete(`${NOTES_PATH}/${id}`);
}

export async function fetchDirectories(): Promise<Directory[]> {
    const response = await apiClient.get<Directory[]>(DIRECTORIES_PATH);
    return response.data;
}

export async function createDirectory(input: CreateDirectoryInput): Promise<Directory> {
    const response = await apiClient.post<Directory>(DIRECTORIES_PATH, input);
    return response.data;
}

export async function renameDirectory(id: string, name: string): Promise<Directory> {
    const response = await apiClient.put<Directory>(`${DIRECTORIES_PATH}/${id}`, { name });
    return response.data;
}

export async function deleteDirectory(id: string): Promise<void> {
    await apiClient.delete(`${DIRECTORIES_PATH}/${id}`);
}
