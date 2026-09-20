import {
    useCallback,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type Ref,
} from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Form, FormControl, FormField, FormItem, FormMessage, cn } from '@roshx/ui';
import { Trash2Icon, XIcon } from 'lucide-react';
import { MODIFIER_KEY_LABEL } from '@/products/notes/keyboard';
import { NoteContentField } from '@/products/notes/editor/NoteContentField';
import { noteFormSchema, type NoteFormValues } from '@/products/notes/editor/note.form';
import { TOOLBAR_GROUPS, type NoteEditorHandle } from '@/products/notes/editor/noteToolbar';
import type { Directory, Note } from '@/products/notes/note.types';
import { NoteComposer } from '@/products/notes/composer/NoteComposer';

const UNCATEGORIZED_OPTION_VALUE = '';

const toolbarButtonClass = (isActive: boolean) =>
    cn(
        'rounded-md px-2 py-1 font-mono text-[11px] leading-none text-notes-ink-faint transition-colors hover:bg-notes-line-faint hover:text-notes-ink',
        isActive &&
            'bg-notes-accent-strong/10 text-notes-accent hover:bg-notes-accent-strong/15 hover:text-notes-accent',
    );

const fieldMessageClass = 'text-xs text-notes-danger';

/** What the page's keyboard shortcuts need to reach inside the form. */
export interface NoteFormHandle {
    requestSubmit: () => void;
    focusTitle: () => void;
    focusContent: () => void;
}

interface NoteFormProps {
    ref?: Ref<NoteFormHandle>;
    editingNote: Note | null;
    directories: Directory[];
    defaultFolderId: string | null;
    onSubmit: (input: NoteFormValues) => Promise<void>;
    onCancelEdit: () => void;
    onDelete: (id: string) => Promise<void>;
}

export function NoteForm({
    ref,
    editingNote,
    directories,
    defaultFolderId,
    onSubmit,
    onCancelEdit,
    onDelete,
}: NoteFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const titleInputRef = useRef<HTMLInputElement | null>(null);
    const titleRegionRef = useRef<HTMLDivElement>(null);
    const contentRegionRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [draftVersion, setDraftVersion] = useState(0);
    const [editorHandle, setEditorHandle] = useState<NoteEditorHandle | null>(null);
    const [isContentScrollable, setIsContentScrollable] = useState(false);

    // What the form shows for the note currently open. RHF resets to this
    // whenever it changes, so it is memoised on the note alone: defaultFolderId
    // is read when a note loads and deliberately left out of the dependencies,
    // because a sidebar click must not reset a half-written note.
    const loadedNoteValues = useMemo<NoteFormValues>(
        () => ({
            title: editingNote?.title ?? '',
            content: editingNote?.content ?? '',
            folderId: editingNote?.folderId ?? defaultFolderId,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultFolderId is read at load time on purpose; see above.
        [editingNote],
    );

    const form = useForm<NoteFormValues>({
        resolver: zodResolver(noteFormSchema),
        defaultValues: loadedNoteValues,
        values: loadedNoteValues,
    });

    // Stable, because the editor re-publishes its handle on every transaction
    // and a new function here would tear that subscription down each time.
    const handleEditorHandleChange = useCallback((handle: NoteEditorHandle) => setEditorHandle(handle), []);

    useImperativeHandle(
        ref,
        () => ({
            requestSubmit: () => formRef.current?.requestSubmit(),
            focusTitle: () => {
                const titleInput = titleInputRef.current;
                titleInput?.focus();
                // Caret at the end, not selecting what is already there — the
                // shortcut is for carrying on, not for starting over.
                titleInput?.setSelectionRange(titleInput.value.length, titleInput.value.length);
            },
            focusContent: () => editorHandle?.focusEnd(),
        }),
        [editorHandle],
    );

    const handleValidSubmit = async (values: NoteFormValues) => {
        await onSubmit(values);
        if (!editingNote) {
            // A create leaves editingNote null, so `values` above stays equal and
            // will not reset the form on its own — this is what clears it, and
            // the content field follows it into the editor.
            form.reset({ title: '', content: '', folderId: defaultFolderId });
            setDraftVersion((version) => version + 1);
        }
    };

    const handleDelete = async () => {
        if (!editingNote) {
            return;
        }
        setIsDeleting(true);
        try {
            await onDelete(editingNote.id);
        } finally {
            setIsDeleting(false);
        }
    };

    const { isSubmitting } = form.formState;

    // A short note should end naturally above the empty space below it. When
    // the content needs more room than the editor frame has, only its middle
    // region scrolls and the title/actions remain reachable.
    useLayoutEffect(() => {
        const formElement = formRef.current;
        const titleRegion = titleRegionRef.current;
        const contentRegion = contentRegionRef.current;
        const footer = footerRef.current;
        if (!formElement || !titleRegion || !contentRegion || !footer) {
            return;
        }

        const updateOverflowState = () => {
            const availableContentHeight =
                formElement.clientHeight - titleRegion.offsetHeight - footer.offsetHeight;
            setIsContentScrollable(contentRegion.scrollHeight > availableContentHeight + 1);
        };

        const observer = new ResizeObserver(updateOverflowState);
        observer.observe(formElement);
        observer.observe(contentRegion);
        observer.observe(titleRegion);
        observer.observe(footer);
        updateOverflowState();

        return () => observer.disconnect();
    }, [editingNote?.id]);

    return (
        <Form {...form}>
            <form
                ref={formRef}
                onSubmit={form.handleSubmit(handleValidSubmit)}
                // The browser's own prompts would fire before the schema does.
                noValidate
                className="flex min-h-0 flex-1 flex-col"
            >
                <div ref={titleRegionRef}>
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="gap-0 border-b border-notes-line-faint">
                                <FormControl>
                                    <input
                                        {...field}
                                        ref={(element) => {
                                            field.ref(element);
                                            titleInputRef.current = element;
                                        }}
                                        type="text"
                                        placeholder="Title"
                                        className="w-full rounded-lg px-4 pt-5 pb-3 text-notes-ink placeholder-notes-ink-faint outline-none"
                                    />
                                </FormControl>
                                <FormMessage className={cn(fieldMessageClass, 'px-3 pb-1')} />
                            </FormItem>
                        )}
                    />
                </div>

                <div
                    ref={contentRegionRef}
                    className={cn(
                        'px-4 py-4',
                        isContentScrollable && 'min-h-0 flex-1 overflow-y-auto overscroll-none',
                    )}
                >
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem className="gap-0">
                                <NoteContentField
                                    field={field}
                                    editorHandle={editorHandle}
                                    onHandleChange={handleEditorHandleChange}
                                />
                                <FormMessage className={cn(fieldMessageClass, 'mt-2')} />
                            </FormItem>
                        )}
                    />
                </div>

                <div
                    ref={footerRef}
                    className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-notes-line-faint bg-notes-surface px-4 pt-3 pb-4"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        {TOOLBAR_GROUPS.map((group) => (
                            <div key={group[0]?.name} className="flex items-center gap-0.5">
                                {group.map((action) => (
                                    <button
                                        key={action.name}
                                        type="button"
                                        title={`${action.title} (${MODIFIER_KEY_LABEL}+${action.shortcut})`}
                                        onClick={() => editorHandle?.toggle(action.name)}
                                        className={toolbarButtonClass(
                                            editorHandle?.activeNames.includes(action.name) ?? false,
                                        )}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        ))}

                        <FormField
                            control={form.control}
                            name="folderId"
                            render={({ field }) => (
                                <FormItem className="gap-0">
                                    <FormControl>
                                        <select
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            // A <select> only speaks strings, so the
                                            // empty option is what "no folder" looks
                                            // like on the way in and out.
                                            value={field.value ?? UNCATEGORIZED_OPTION_VALUE}
                                            onChange={(event) => field.onChange(event.target.value || null)}
                                            title="Folder"
                                            className="rounded-md border border-notes-line bg-notes-surface px-2 py-1 text-xs text-notes-ink-muted outline-none transition-colors hover:text-notes-ink focus:border-notes-accent"
                                        >
                                            <option value={UNCATEGORIZED_OPTION_VALUE}>Uncategorized</option>
                                            {directories.map((directory) => (
                                                <option key={directory.id} value={directory.id}>
                                                    {directory.name}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <NoteComposer
                            key={`${editingNote?.id ?? 'draft'}:${draftVersion}`}
                            disabled={isSubmitting || isDeleting}
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-notes-accent-strong px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-notes-accent focus-visible:ring-2 focus-visible:ring-notes-accent-strong/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? editingNote
                                    ? 'Saving…'
                                    : 'Adding…'
                                : editingNote
                                  ? 'Save'
                                  : 'Add'}
                        </button>
                        {editingNote && (
                            <>
                                <Button
                                    type="button"
                                    onClick={onCancelEdit}
                                    variant="ghost"
                                    size="icon-sm"
                                    title="Cancel editing"
                                    aria-label="Cancel editing"
                                    className="text-notes-ink-muted hover:bg-notes-line hover:text-notes-ink focus-visible:ring-notes-line-strong"
                                >
                                    <XIcon aria-hidden="true" className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => void handleDelete()}
                                    disabled={isDeleting}
                                    variant="ghost"
                                    size="icon-sm"
                                    title={isDeleting ? 'Deleting note' : 'Delete note'}
                                    aria-label={isDeleting ? 'Deleting note' : 'Delete note'}
                                    className="text-notes-danger hover:bg-notes-danger/10 hover:text-notes-danger focus-visible:ring-notes-danger/40"
                                >
                                    <Trash2Icon aria-hidden="true" className="size-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </Form>
    );
}
