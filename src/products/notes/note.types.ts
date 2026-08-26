export interface Note {
    id: string;
    title: string;
    content: string;
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoteInput {
    title: string;
    content: string;
    folderId: string | null;
}

export type UpdateNoteInput = Partial<CreateNoteInput>;

export interface Directory {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDirectoryInput {
    name: string;
}
