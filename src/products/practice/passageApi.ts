import { apiClient } from '@/shared/lib/apiClient';
import type { Passage } from '@/products/practice/passage.types';

const PASSAGES_PATH = '/roshx/practice/passages';

/** How many recent passages to pull to open the page with one of them. */
const RECENT_PASSAGE_POOL_SIZE = 10;

/**
 * The passages other people have already generated, to open the page with one
 * of them.
 *
 * An empty page gives a first-time visitor nothing to do, and generating one
 * for them would cost ten seconds before they have asked for anything.
 */
export async function fetchRecentPassages(): Promise<Passage[]> {
    const response = await apiClient.get<Passage[]>(PASSAGES_PATH, {
        params: { limit: RECENT_PASSAGE_POOL_SIZE },
    });
    return response.data;
}

/** One line of free text in, something worth typing out. */
export async function generatePassage(input: string): Promise<Passage> {
    const response = await apiClient.post<Passage>(`${PASSAGES_PATH}/generate`, { input });
    return response.data;
}
