import { apiClient } from '@/shared/lib/apiClient';
import type { Passage } from '@/products/practice/passage.types';

const PASSAGES_PATH = '/roshx/practice/passages';

/** How many recent passages to pull to open the page with one of them. */
const OPENING_PASSAGE_POOL_SIZE = 10;

/**
 * One of the passages other people have already generated.
 *
 * Only used to put something in the window on arrival — an empty page gives a
 * first-time visitor nothing to do, and generating one for them would cost ten
 * seconds before they have asked for anything.
 */
export async function fetchOpeningPassage(): Promise<Passage | null> {
    const response = await apiClient.get<Passage[]>(PASSAGES_PATH, {
        params: { limit: OPENING_PASSAGE_POOL_SIZE },
    });
    const recentPassages = response.data;
    if (recentPassages.length === 0) {
        return null;
    }
    // Chosen here rather than in the component: picking at random while
    // rendering would hand back a different passage on every re-render.
    return recentPassages[Math.floor(Math.random() * recentPassages.length)] ?? null;
}

/** One line of free text in, something worth typing out. */
export async function generatePassage(input: string): Promise<Passage> {
    const response = await apiClient.post<Passage>(`${PASSAGES_PATH}/generate`, { input });
    return response.data;
}
