import type { PassageFormat } from '@/products/practice/passage-format.enum';

/** One generated passage, exactly as the roshx API returns it. */
export interface Passage {
    id: string;
    topicId: string;
    title: string;
    content: string;
    format: PassageFormat;
    characterCount: number;
    wordCount: number;
    reactions: Record<string, number>;
    createdAt: string;
    updatedAt: string;
}
