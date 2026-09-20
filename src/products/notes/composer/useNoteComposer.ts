import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { NoteFormValues } from '@/products/notes/editor/note.form';
import { composeNote, COMPOSER_MAX_MESSAGES, type ComposerMessage } from './composerApi';

export function useNoteComposer() {
    const form = useFormContext<NoteFormValues>();
    const [messages, setMessages] = useState<ComposerMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [pendingMessage, setPendingMessage] = useState<ComposerMessage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const requestRef = useRef<AbortController | null>(null);
    const pendingTextRef = useRef('');

    useEffect(() => () => requestRef.current?.abort(), []);

    const cancel = () => {
        requestRef.current?.abort();
        requestRef.current = null;
        if (pendingTextRef.current) setDraft(pendingTextRef.current);
        pendingTextRef.current = '';
        setPendingMessage(null);
    };

    const send = async () => {
        const text = draft.trim();
        if (!text || requestRef.current || messages.length >= COMPOSER_MAX_MESSAGES) return;

        const controller = new AbortController();
        requestRef.current = controller;
        pendingTextRef.current = text;
        const userMessage: ComposerMessage = { role: 'user', parts: [{ text }] };
        // Explicitly pick the model's fields: folderId and future form metadata
        // must never ride along with a model request.
        const { title, content } = form.getValues();
        setPendingMessage(userMessage);
        setDraft('');
        setError(null);
        try {
            const result = await composeNote(
                { formData: { title, content }, messages: [...messages, userMessage] },
                controller.signal,
            );
            if (controller.signal.aborted) return;

            const current = form.getValues();
            if (current.title !== title || current.content !== content) {
                setError('The note changed while AI was replying. Send again to use your latest edits.');
                setDraft(text);
                return;
            }
            form.setValue('title', result.formData.title, { shouldDirty: true, shouldValidate: true });
            form.setValue('content', result.formData.content, { shouldDirty: true, shouldValidate: true });
            setMessages(result.messages);
        } catch {
            if (!controller.signal.aborted) {
                setError('Could not get an AI reply. Your note is unchanged. Please try again.');
                setDraft(text);
            }
        } finally {
            // An aborted request may finish after a new one has started.
            if (requestRef.current === controller) {
                requestRef.current = null;
                pendingTextRef.current = '';
                setPendingMessage(null);
            }
        }
    };

    const reset = () => {
        cancel();
        setMessages([]);
        setDraft('');
        setError(null);
    };

    return { messages, draft, setDraft, pendingMessage, error, send, cancel, reset };
}
