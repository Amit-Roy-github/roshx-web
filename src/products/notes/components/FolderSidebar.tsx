import { useState, type KeyboardEvent } from 'react';
import { Button, cn } from '@roshx/ui';
import { FolderIcon, FolderPlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { SpecialFolder } from '@/products/notes/specialFolder.enum';
import type { Directory, Note } from '@/products/notes/note.types';

const rowClass = (isActive: boolean) =>
    cn(
        'relative -mx-3 flex min-w-0 flex-1 px-4 py-2 text-left text-sm transition-colors',
        isActive
            ? 'border-r-2 border-notes-accent bg-notes-line-faint text-notes-ink'
            : 'text-notes-ink-muted hover:bg-notes-line-faint hover:text-notes-ink',
    );

const inlineInputClass =
    'min-w-0 flex-1 rounded-md border border-notes-line px-2.5 py-1.5 text-sm text-notes-ink outline-none focus:border-notes-accent';

/**
 * Focus the input the moment it appears, with whatever is already in it
 * selected — renaming a folder is usually replacing the name, not appending to
 * it. `autoFocus` alone only does the focusing half.
 */
const focusAndSelectOnMount = (input: HTMLInputElement | null) => {
    input?.focus();
    input?.select();
};

const iconButtonClass =
    'size-7 text-notes-ink-faint hover:bg-notes-line-faint hover:text-notes-ink focus-visible:ring-notes-accent/30';

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
        <div className="flex flex-col gap-0.5 border-b border-notes-line-faint pb-1">
            <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-notes-ink-faint uppercase">
                    <FolderIcon aria-hidden="true" className="size-3.5" />
                    Folders
                </span>
                <Button
                    type="button"
                    title="New folder"
                    aria-label="New folder"
                    onClick={() => setNewFolderName('')}
                    variant="ghost"
                    size="icon-xs"
                    className="text-notes-ink-faint hover:bg-notes-line-faint hover:text-notes-ink focus-visible:ring-notes-accent/30"
                >
                    <FolderPlusIcon aria-hidden="true" className="size-3.5" />
                </Button>
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
                    ref={focusAndSelectOnMount}
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

            {directories.map((directory) => {
                const isActive = selectedFolder === directory.id;

                return (
                    <div
                        key={directory.id}
                        className={cn(
                            'group -mx-3 flex items-center',
                            isActive && 'border-r-2 border-notes-accent bg-notes-line-faint',
                        )}
                    >
                        {renamingFolderId === directory.id ? (
                            <input
                                type="text"
                                ref={focusAndSelectOnMount}
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
                                className={cn(inlineInputClass, 'mx-3')}
                            />
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="min-w-0 flex-1 px-4 py-2 text-left text-sm text-notes-ink-muted transition-colors hover:text-notes-ink"
                                    onClick={() => onSelectFolder(directory.id)}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="truncate">{directory.name}</span>
                                        <span className="text-xs text-notes-ink-faint">
                                            {notes.filter((note) => note.folderId === directory.id).length}
                                        </span>
                                    </span>
                                </button>
                                <div className="hidden shrink-0 items-center gap-0.5 pr-1 group-hover:flex">
                                    <Button
                                        type="button"
                                        title="Rename folder"
                                        aria-label={`Rename ${directory.name}`}
                                        onClick={() => {
                                            setRenamingFolderId(directory.id);
                                            setRenameValue(directory.name);
                                        }}
                                        variant="ghost"
                                        size="icon-xs"
                                        className={iconButtonClass}
                                    >
                                        <PencilIcon aria-hidden="true" className="size-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        title="Delete folder"
                                        aria-label={`Delete ${directory.name}`}
                                        onClick={() => void onDeleteFolder(directory.id)}
                                        variant="ghost"
                                        size="icon-xs"
                                        className="size-7 text-notes-ink-faint hover:bg-notes-danger/10 hover:text-notes-danger focus-visible:ring-notes-danger/30"
                                    >
                                        <Trash2Icon aria-hidden="true" className="size-3.5" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}

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
