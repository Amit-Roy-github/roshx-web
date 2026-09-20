import { z } from 'zod';
import { apiClient } from '@/shared/lib/apiClient';

export const COMPOSER_MESSAGE_MAX_LENGTH = 8_000;
export const COMPOSER_MAX_MESSAGES = 40;

const formDataSchema = z.object({ title: z.string(), content: z.string() }).strict();
const messageSchema = z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })).length(1),
});
const responseSchema = z.object({
    formData: formDataSchema,
    messages: z.array(messageSchema).min(2).max(COMPOSER_MAX_MESSAGES),
});

export type ComposerFormData = z.infer<typeof formDataSchema>;
export type ComposerMessage = z.infer<typeof messageSchema>;
export interface ComposerRequest {
    formData: ComposerFormData;
    messages: ComposerMessage[];
}

export async function composeNote(request: ComposerRequest, signal: AbortSignal) {
    const response = await apiClient.post<unknown>('/roshx/notes/composer', request, { signal });
    return responseSchema.parse(response.data);
}
