/**
 * What the editor toolbar offers, described without naming Tiptap.
 *
 * The form draws these buttons and the editor carries them out, and the editor
 * is loaded lazily — so this has to be knowable without pulling the editor in.
 */
export interface ToolbarAction {
    label: string;
    /** The Tiptap node or mark name, which is also how "is it on" is asked. */
    name: string;
    shortcut: string;
    title: string;
}

/** Grouped the way the toolbar reads: marks, then lists, then blocks. */
export const TOOLBAR_GROUPS: readonly (readonly ToolbarAction[])[] = [
    [
        { label: 'B', name: 'bold', shortcut: 'B', title: 'Bold' },
        { label: 'I', name: 'italic', shortcut: 'I', title: 'Italic' },
        { label: '</>', name: 'code', shortcut: 'E', title: 'Inline code' },
    ],
    [
        { label: '•—', name: 'bulletList', shortcut: 'Shift+8', title: 'Bullet list' },
        { label: '1—', name: 'orderedList', shortcut: 'Shift+7', title: 'Numbered list' },
        { label: '☑—', name: 'taskList', shortcut: 'Shift+9', title: 'Task list' },
    ],
    [{ label: '{ }', name: 'codeBlock', shortcut: 'Alt+C', title: 'Code block' }],
];

/**
 * What the form gets back once the editor has loaded: which formats are on
 * under the cursor, and how to turn one on or off.
 */
export interface NoteEditorHandle {
    activeNames: readonly string[];
    toggle: (actionName: string) => void;
    /** Puts the caret back at the end of the note, for the focus shortcut. */
    focusEnd: () => void;
    /** Replaces the whole note body — how an AI edit lands in the editor. */
    setContent: (html: string) => void;
}
