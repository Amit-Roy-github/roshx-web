import { apiClient } from '@/shared/lib/apiClient';

const ATTEMPTS_PATH = '/roshx/practice/attempts';

export interface AttemptReport {
    attemptId: string;
    passageId: string;
    charactersTyped: number;
    wordsPerMinute: number;
    accuracyPercentage: number;
    isComplete: boolean;
}

/**
 * Tell the server how one run at one passage is going.
 *
 * Sent more than once for the same attempt — first keystroke, every so often
 * while typing, and once more when the run ends — because somebody who types
 * for ten minutes and closes the tab has still been typing, and only a row that
 * keeps being updated can say so.
 *
 * PUT, not POST: the id comes from here, so repeating a report leaves the row
 * exactly as it was.
 */
export async function reportAttempt({ attemptId, ...report }: AttemptReport): Promise<void> {
    await apiClient.put(`${ATTEMPTS_PATH}/${attemptId}`, report);
}
