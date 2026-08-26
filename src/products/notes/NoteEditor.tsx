import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@roshx/ui';
import { extractMarkdownFromClipboard, markdownToTiptapHtml } from '@/products/notes/markdownToTiptapHtml';

/** Mac writes ⌘; everyone else writes Ctrl. Only ever shown in a tooltip, and
 * navigator.platform is deprecated, so the frozen userAgent string is enough. */
const MODIFIER_KEY_LABEL = navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl';

interface ToolbarAction {
    label: string;
    /** The Tiptap node or mark name, which is also how "is it on" is asked. */
    name: string;
    shortcut: string;
    title: string;
    apply: (editor: Editor) => void;
}

/**
 * Grouped the way the toolbar reads: marks, then lists, then blocks.
 *
 * Data rather than seven near-identical buttons — the only thing that differs
 * between them is the label and one chained command.
 */
const TOOLBAR_GROUPS: ToolbarAction[][] = [
    [
        {
            label: 'B',
            name: 'bold',
            shortcut: 'B',
            title: 'Bold',
            apply: (editor) => editor.chain().focus().toggleBold().run(),
        },
        {
            label: 'I',
            name: 'italic',
            shortcut: 'I',
            title: 'Italic',
            apply: (editor) => editor.chain().focus().toggleItalic().run(),
        },
        {
            label: '</>',
            name: 'code',
            shortcut: 'E',
            title: 'Inline code',
            apply: (editor) => editor.chain().focus().toggleCode().run(),
        },
    ],
    [
        {
            label: '•—',
            name: 'bulletList',
            shortcut: 'Shift+8',
            title: 'Bullet list',
            apply: (editor) => editor.chain().focus().toggleBulletList().run(),
        },
        {
            label: '1—',
            name: 'orderedList',
            shortcut: 'Shift+7',
            title: 'Numbered list',
            apply: (editor) => editor.chain().focus().toggleOrderedList().run(),
        },
        {
            label: '☑—',
            name: 'taskList',
            shortcut: 'Shift+9',
            title: 'Task list',
            apply: (editor) => editor.chain().focus().toggleTaskList().run(),
        },
    ],
    [
        {
            label: '{ }',
            name: 'codeBlock',
            shortcut: 'Alt+C',
            title: 'Code block',
            apply: (editor) => editor.chain().focus().toggleCodeBlock().run(),
        },
    ],
];

const EDITOR_CLASS_NAME =
    'note-prose min-h-[8rem] text-base leading-normal tracking-normal caret-primary outline-none';

interface NoteEditorProps {
    initialContent: string;
    onChange: (html: string) => void;
}

/**
 * The note body: a Tiptap editor and the toolbar that drives it.
 *
 * The toolbar lives here rather than in the form because every button needs the
 * editor — separating them would mean handing fifteen methods out through a
 * ref, which is what the Svelte version had to do.
 */
export function NoteEditor({ initialContent, onChange }: NoteEditorProps) {
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
                const markdownText = event.clipboardData && extractMarkdownFromClipboard(event.clipboardData);
                if (!markdownText) {
                    return false;
                }
                // Markdown pasted from elsewhere arrives as plain text, and
                // Tiptap would keep the asterisks. Converted here so a pasted
                // note looks like a written one.
                event.preventDefault();
                editor?.chain().focus().insertContent(markdownToTiptapHtml(markdownText)).run();
                return true;
            },
        },
        onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getHTML()),
    });

    // Subscribed to the marks alone: without this the toolbar would only notice
    // the cursor moving into bold text on the next unrelated re-render.
    // A joined string rather than an array, because useEditorState re-renders
    // on anything it cannot compare — and a fresh array is never equal to the
    // last one.
    const activeNames = useEditorState({
        editor,
        selector: ({ editor: currentEditor }) =>
            TOOLBAR_GROUPS.flat()
                .filter((action) => currentEditor?.isActive(action.name))
                .map((action) => action.name)
                .join(' '),
    });
    // Split back into whole names: 'code' is a substring of 'codeBlock', so a
    // plain includes() would light up the inline-code button inside a block.
    const activeNameList = activeNames ? activeNames.split(' ') : [];

    return (
        <div>
            <EditorContent editor={editor} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
                {TOOLBAR_GROUPS.map((group) => (
                    <div key={group[0]?.name} className="flex items-center gap-0.5">
                        {group.map((action) => (
                            <button
                                key={action.name}
                                type="button"
                                title={`${action.title} (${MODIFIER_KEY_LABEL}+${action.shortcut})`}
                                onClick={() => editor && action.apply(editor)}
                                className={cn(
                                    'rounded-md px-2 py-1 font-mono text-[11px] leading-none text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                                    activeNameList.includes(action.name) && 'bg-primary/10 text-primary',
                                )}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
