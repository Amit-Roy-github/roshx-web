import { z } from 'zod';

export const TITLE_REQUIRED_MESSAGE = 'Tilte is required';
export const EMPTY_CONTENT_MESSAGE = 'Your content is empty';

/** Tiptap always returns markup, so emptiness is a question about the text inside it. */
export function isHtmlEmpty(html: string): boolean {
    return html.replace(/<[^>]*>/g, '').trim().length === 0;
}

export const noteFormSchema = z.object({
    title: z.string().min(1, TITLE_REQUIRED_MESSAGE),
    content: z.string().refine((html) => !isHtmlEmpty(html), EMPTY_CONTENT_MESSAGE),
    // Uncategorized is the absence of a folder, which the API stores as null.
    folderId: z.string().nullable(),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
