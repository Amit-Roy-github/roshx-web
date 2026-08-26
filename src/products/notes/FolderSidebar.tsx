import { useState, type KeyboardEvent } from 'react';
import { cn } from '@roshx/ui';
import { SpecialFolder } from '@/products/notes/specialFolder.enum';
import type { Directory, Note } from '@/products/notes/note.types';

const rowClass = (isActive: boolean) =>
    cn(
        'min-w-0 flex-1 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
        isActive
            ? 'bg-notes-accent-strong/10 text-notes-accent'
            : 'text-notes-ink-muted hover:bg-notes-line-faint hover:text-notes-ink',
    );

const inlineInputClass =
    'min-w-0 flex-1 rounded-md border border-notes-line px-2.5 py-1.5 text-sm text-notes-ink outline-none focus:border-notes-accent';

const iconButtonClass =
    'rounded px-1 py-0.5 text-xs text-notes-ink-faint transition-colors hover:bg-notes-line-faint hover:text-notes-ink';

interface FolderSidebarProps {
    directories: Directory[];
    notes: Note[];
    selectedFolder: string;
    onSelectFolder: (folder: string) => void;
    onCreateFolder: (name: string) => Promise<void>;
    onRenameFolder: (id: string, name: string) => Promise<void>;
    onDeleteFolder: (id: string) => Promise<void>;
}

export function FolderSidebar({
    directories,
    notes,
    selectedFolder,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
}: FolderSidebarProps) {
    const [newFolderName, setNewFolderName] = useState<string | null>(null);
    const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const uncategorizedCount = notes.filter((note) => note.folderId === null).length;

    const submitCreate = async () => {
        // Removing the focused input fires a native blur, which would re-enter
        // this through onBlur and create the folder twice.
        if (newFolderName === null) {
            return;
        }
        const name = newFolderName.trim();
        setNewFolderName(null);
        if (name) {
            await onCreateFolder(name);
        }
    };

    const submitRename = async (id: string) => {
        if (renamingFolderId === null) {
            return;
        }
        const name = renameValue.trim();
        setRenamingFolderId(null);
        if (name) {
            await onRenameFolder(id, name);
        }
    };

    const handleEditingKeyDown = (event: KeyboardEvent, commit: () => void, cancel: () => void) => {
        if (event.key === 'Enter') {
            commit();
        }
        if (event.key === 'Escape') {
            cancel();
        }
    };

    return (
        <div className="flex flex-col gap-0.5 border-b border-notes-line-faint pb-3">
            <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-xs font-semibold tracking-wide text-notes-ink-faint uppercase">
                    Folders
                </span>
                <button
                    type="button"
                    title="New folder"
                    onClick={() => setNewFolderName('')}
                    className="rounded px-1.5 py-0.5 text-xs text-notes-ink-faint transition-colors hover:bg-notes-line-faint hover:text-notes-ink"
                >
                    +
                </button>
            </div>

            <button
                type="button"
                className={rowClass(selectedFolder === SpecialFolder.ALL)}
                onClick={() => onSelectFolder(SpecialFolder.ALL)}
            >
                <span className="flex items-center justify-between gap-2">
                    <span className="truncate">All Notes</span>
                    <span className="text-xs text-notes-ink-faint">{notes.length}</span>
                </span>
            </button>

            {newFolderName !== null && (
                <input
                    type="text"
                    autoFocus
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    onBlur={() => void submitCreate()}
                    onKeyDown={(event) =>
                        handleEditingKeyDown(
                            event,
                            () => void submitCreate(),
                            () => setNewFolderName(null),
                        )
                    }
                    className={inlineInputClass}
                />
            )}

            {directories.map((directory) => (
                <div key={directory.id} className="group flex items-center gap-1">
                    {renamingFolderId === directory.id ? (
                        <input
                            type="text"
                            autoFocus
                            aria-label="Rename folder"
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            onBlur={() => void submitRename(directory.id)}
                            onKeyDown={(event) =>
                                handleEditingKeyDown(
                                    event,
                                    () => void submitRename(directory.id),
                                    () => setRenamingFolderId(null),
                                )
                            }
                            className={inlineInputClass}
                        />
                    ) : (
                        <>
                            <button
                                type="button"
                                className={rowClass(selectedFolder === directory.id)}
                                onClick={() => onSelectFolder(directory.id)}
                            >
                                <span className="flex items-center justify-between gap-2">
                                    <span className="truncate">{directory.name}</span>
                                    <span className="text-xs text-notes-ink-faint">
                                        {notes.filter((note) => note.folderId === directory.id).length}
                                    </span>
                                </span>
                            </button>
                            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                                <button
                                    type="button"
                                    title="Rename folder"
                                    onClick={() => {
                                        setRenamingFolderId(directory.id);
                                        setRenameValue(directory.name);
                                    }}
                                    className={iconButtonClass}
                                >
                                    ✎
                                </button>
                                <button
                                    type="button"
                                    title="Delete folder"
                                    onClick={() => void onDeleteFolder(directory.id)}
                                    className="rounded px-1 py-0.5 text-xs text-notes-ink-faint transition-colors hover:bg-notes-danger/10 hover:text-notes-danger"
                                >
                                    ✕
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            <button
                type="button"
                className={rowClass(selectedFolder === SpecialFolder.UNCATEGORIZED)}
                onClick={() => onSelectFolder(SpecialFolder.UNCATEGORIZED)}
            >
                <span className="flex items-center justify-between gap-2">
                    <span className="truncate">Uncategorized</span>
                    <span className="text-xs text-notes-ink-faint">{uncategorizedCount}</span>
                </span>
            </button>
        </div>
    );
}
