import { Suspense, lazy, useCallback, useEffect, useRef } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import type { NoteFormValues } from '@/products/notes/editor/note.form';
import type { NoteEditorHandle } from '@/products/notes/editor/noteToolbar';

// Tiptap and its extensions are the heaviest thing this app loads and are not
// needed for first paint, so they are split into their own chunk instead of
// sitting on the path that blocks the page becoming interactive.
const NoteEditor = lazy(() =>
    import('@/products/notes/editor/NoteEditor').then((module) => ({ default: module.NoteEditor })),
);

interface NoteContentFieldProps {
    field: ControllerRenderProps<NoteFormValues, 'content'>;
    /** Published by the editor itself; null until the lazy chunk has loaded. */
    editorHandle: NoteEditorHandle | null;
    onHandleChange: (handle: NoteEditorHandle) => void;
}

/**
 * The `content` field, bridged onto Tiptap.
 *
 * Tiptap owns its own document, so this field cannot be controlled the way an
 * input is: re-applying `field.value` on every render would throw the caret to
 * the top of the note on each keystroke. Instead the editor pushes upward, and
 * the form only writes back when the value changed somewhere else — a different
 * note loading, or a reset after a save. `lastSyncedHtml` is what tells those
 * two apart.
 */
export function NoteContentField({ field, editorHandle, onHandleChange }: NoteContentFieldProps) {
    const lastSyncedHtmlRef = useRef(field.value);

    const handleEditorChange = useCallback(
        (html: string) => {
            lastSyncedHtmlRef.current = html;
            field.onChange(html);
        },
        [field],
    );

    useEffect(() => {
        if (!editorHandle || field.value === lastSyncedHtmlRef.current) {
            return;
        }
        lastSyncedHtmlRef.current = field.value;
        editorHandle.setContent(field.value);
    }, [editorHandle, field.value]);

    return (
        <Suspense fallback={<div className="min-h-[8rem] animate-pulse rounded-md bg-notes-line-faint" />}>
            <NoteEditor
                initialContent={field.value}
                onChange={handleEditorChange}
                onHandleChange={onHandleChange}
            />
        </Suspense>
    );
}
