import { useCallback, useEffect, useMemo, useState } from 'react';

/** How often the live score refreshes while the reader is mid-passage. */
const SCORE_REFRESH_INTERVAL_MS = 250;

/** Standard typing-test convention: five characters count as one word. */
const CHARACTERS_PER_WORD = 5;
const MILLISECONDS_PER_MINUTE = 60_000;

export interface TypingProgress {
    typedText: string;
    startedAt: number | null;
    finishedAt: number | null;
}

export interface TypingSession {
    typedText: string;
    /** Index of the character the reader is about to type. */
    cursorIndex: number;
    correctCharacterCount: number;
    /** Seconds since the first keystroke, frozen once the passage is finished. */
    elapsedSeconds: number;
    wordsPerMinute: number;
    accuracyPercentage: number;
    hasStarted: boolean;
    isComplete: boolean;
    handleTypedTextChange: (nextTypedText: string) => void;
    restart: () => void;
}

/**
 * The typing engine: everything about one attempt at one passage.
 *
 * Deliberately state-only — it renders nothing and knows nothing about the DOM,
 * so the window can change how a passage looks without touching the scoring.
 */
export function useTypingSession(passageContent: string): TypingSession {
    const [progress, setProgress] = useState<TypingProgress>({
        typedText: '',
        startedAt: null,
        finishedAt: null,
    });

    const handleTypedTextChange = useCallback(
        (nextTypedText: string) => {
            setProgress((current) => {
                if (current.finishedAt !== null) {
                    return current;
                }
                // Typing past the end of the passage is not an error, it is the end.
                const clampedText = nextTypedText.slice(0, passageContent.length);
                const isComplete = clampedText.length === passageContent.length;
                return {
                    typedText: clampedText,
                    startedAt: current.startedAt ?? (clampedText.length > 0 ? Date.now() : null),
                    finishedAt: isComplete ? Date.now() : null,
                };
            });
        },
        [passageContent],
    );

    // Elapsed time has to come from state, not from a Date.now() call during
    // render: reading the clock while rendering is impure, and without a tick
    // the score would sit frozen until the next keystroke.
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        if (progress.startedAt === null || progress.finishedAt !== null) {
            return;
        }
        const intervalId = setInterval(() => setCurrentTime(Date.now()), SCORE_REFRESH_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [progress.startedAt, progress.finishedAt]);

    const restart = useCallback(() => {
        setProgress({ typedText: '', startedAt: null, finishedAt: null });
    }, []);

    const correctCharacterCount = useMemo(() => {
        let correct = 0;
        for (let index = 0; index < progress.typedText.length; index++) {
            if (progress.typedText[index] === passageContent[index]) {
                correct++;
            }
        }
        return correct;
    }, [progress.typedText, passageContent]);

    const elapsedMilliseconds =
        progress.startedAt === null ? 0 : (progress.finishedAt ?? currentTime) - progress.startedAt;

    // Gross WPM over correct characters only, so hammering wrong keys cannot
    // inflate the score.
    const wordsPerMinute =
        elapsedMilliseconds > 0
            ? Math.round(
                  (correctCharacterCount / CHARACTERS_PER_WORD / elapsedMilliseconds) *
                      MILLISECONDS_PER_MINUTE,
              )
            : 0;

    const accuracyPercentage =
        progress.typedText.length > 0
            ? Math.round((correctCharacterCount / progress.typedText.length) * 100)
            : 100;

    return {
        typedText: progress.typedText,
        cursorIndex: progress.typedText.length,
        correctCharacterCount,
        elapsedSeconds: Math.floor(elapsedMilliseconds / 1000),
        wordsPerMinute,
        accuracyPercentage,
        hasStarted: progress.startedAt !== null,
        isComplete: progress.finishedAt !== null,
        handleTypedTextChange,
        restart,
    };
}
