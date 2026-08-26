import { useState, type KeyboardEvent } from 'react';
import { cn, Input } from '@roshx/ui';
import { SpecialFolder } from '@/products/notes/specialFolder.enum';
import type { Directory, Note } from '@/products/notes/note.types';

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
            event.preventDefault();
            commit();
        }
        if (event.key === 'Escape') {
            cancel();
        }
    };

    return (
        <nav className="flex flex-col gap-1">
            <FolderRow
                label="All notes"
                count={notes.length}
                isSelected={selectedFolder === SpecialFolder.ALL}
                onSelect={() => onSelectFolder(SpecialFolder.ALL)}
            />
            <FolderRow
                label="Uncategorized"
                count={uncategorizedCount}
                isSelected={selectedFolder === SpecialFolder.UNCATEGORIZED}
                onSelect={() => onSelectFolder(SpecialFolder.UNCATEGORIZED)}
            />

            {directories.map((directory) =>
                renamingFolderId === directory.id ? (
                    <Input
                        key={directory.id}
                        autoFocus
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
                        className="h-8 text-sm"
                    />
                ) : (
                    <div key={directory.id} className="group flex items-center gap-1">
                        <FolderRow
                            label={directory.name}
                            count={notes.filter((note) => note.folderId === directory.id).length}
                            isSelected={selectedFolder === directory.id}
                            onSelect={() => onSelectFolder(directory.id)}
                            onRename={() => {
                                setRenamingFolderId(directory.id);
                                setRenameValue(directory.name);
                            }}
                        />
                        <button
                            type="button"
                            title={`Delete ${directory.name}`}
                            onClick={() => void onDeleteFolder(directory.id)}
                            className="rounded px-1.5 py-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                        >
                            ✕
                        </button>
                    </div>
                ),
            )}

            {newFolderName === null ? (
                <button
                    type="button"
                    onClick={() => setNewFolderName('')}
                    className="mt-2 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                    + New folder
                </button>
            ) : (
                <Input
                    autoFocus
                    value={newFolderName}
                    placeholder="Folder name"
                    onChange={(event) => setNewFolderName(event.target.value)}
                    onBlur={() => void submitCreate()}
                    onKeyDown={(event) =>
                        handleEditingKeyDown(
                            event,
                            () => void submitCreate(),
                            () => setNewFolderName(null),
                        )
                    }
                    className="mt-2 h-8 text-sm"
                />
            )}
        </nav>
    );
}

interface FolderRowProps {
    label: string;
    count: number;
    isSelected: boolean;
    onSelect: () => void;
    /** Only real folders can be renamed; "All notes" is a filter, not a folder. */
    onRename?: () => void;
}

function FolderRow({ label, count, isSelected, onSelect, onRename }: FolderRowProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            onDoubleClick={onRename}
            title={onRename ? 'Double-click to rename' : undefined}
            className={cn(
                'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
        >
            <span className="truncate">{label}</span>
            <span className="text-xs">{count}</span>
        </button>
    );
}
