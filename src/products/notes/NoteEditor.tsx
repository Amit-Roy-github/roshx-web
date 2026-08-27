import { useEffect, useRef } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { extractMarkdownFromClipboard, markdownToTiptapHtml } from '@/products/notes/markdownToTiptapHtml';
import { TOOLBAR_GROUPS, type NoteEditorHandle } from '@/products/notes/noteToolbar';

/** The one place a toolbar name becomes an editor command. */
const COMMAND_BY_ACTION_NAME: Record<string, (editor: Editor) => void> = {
    bold: (editor) => editor.chain().focus().toggleBold().run(),
    italic: (editor) => editor.chain().focus().toggleItalic().run(),
    code: (editor) => editor.chain().focus().toggleCode().run(),
    bulletList: (editor) => editor.chain().focus().toggleBulletList().run(),
    orderedList: (editor) => editor.chain().focus().toggleOrderedList().run(),
    taskList: (editor) => editor.chain().focus().toggleTaskList().run(),
    codeBlock: (editor) => editor.chain().focus().toggleCodeBlock().run(),
};

const EDITOR_CLASS_NAME =
    'note-prose min-h-[8rem] outline-none text-base leading-normal tracking-normal text-notes-ink caret-notes-accent';

interface NoteEditorProps {
    initialContent: string;
    onChange: (html: string) => void;
    /**
     * Handed up so the toolbar can sit in the form's footer row, beside the
     * folder picker and the save buttons, exactly where it was. The editor is
     * loaded lazily, so nothing crossing this boundary names a Tiptap type.
     */
    onHandleChange: (handle: NoteEditorHandle) => void;
}

export function NoteEditor({ initialContent, onChange, onHandleChange }: NoteEditorProps) {
    // handlePaste is built before useEditor returns, so it cannot close over the
    // editor itself — it reads it back through here instead.
    const editorRef = useRef<Editor | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({ placeholder: 'Write here...' }),
        ],
        content: initialContent,
        editorProps: {
            attributes: { class: EDITOR_CLASS_NAME },
            handlePaste: (_view, event) => {
                const pastedEditor = editorRef.current;
                if (!pastedEditor || !event.clipboardData) {
                    return false;
                }
                const markdownText = extractMarkdownFromClipboard(event.clipboardData);
                if (markdownText === null) {
                    return false;
                }
                // Markdown pasted from elsewhere arrives as plain text and Tiptap
                // would keep the asterisks. Converted so a pasted note looks like
                // a written one.
                event.preventDefault();
                pastedEditor.chain().focus().insertContent(markdownToTiptapHtml(markdownText)).run();
                return true;
            },
        },
        onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getHTML()),
    });

    useEffect(() => {
        if (!editor) {
            return;
        }
        // Set here rather than during render: this runs on mount, long before
        // anyone can paste into an editor they have not seen yet.
        editorRef.current = editor;
        // Every transaction, not only every edit: moving the cursor into bold
        // text changes what the toolbar should show without changing the note.
        const publishHandle = () => {
            onHandleChange({
                activeNames: TOOLBAR_GROUPS.flat()
                    .filter((action) => editor.isActive(action.name))
                    .map((action) => action.name),
                toggle: (actionName) => COMMAND_BY_ACTION_NAME[actionName]?.(editor),
                focusEnd: () => editor.commands.focus('end'),
            });
        };
        publishHandle();
        editor.on('transaction', publishHandle);
        return () => {
            editor.off('transaction', publishHandle);
            editorRef.current = null;
        };
    }, [editor, onHandleChange]);

    return <EditorContent editor={editor} />;
}
