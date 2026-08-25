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
/** Only spaces and tabs open a line; a newline ends one. */
const INDENTATION_PATTERN = /^[ \t]*/;

/**
 * Fills in the indentation a line opens with instead of asking for it.
 *
 * Code is mostly indentation, and holding the space bar down measures patience
 * rather than typing. An editor jumps past it when you press Enter, so the test
 * does the same — at the start of the passage and after every line break.
 */
function withIndentationFilled(passageContent: string, typedText: string): string {
    const isAtLineStart = typedText.length === 0 || passageContent[typedText.length - 1] === '\n';
    if (!isAtLineStart) {
        return typedText;
    }
    const indentation = INDENTATION_PATTERN.exec(passageContent.slice(typedText.length))?.[0] ?? '';
    return typedText + indentation;
}

function createProgress(passageContent: string): TypingProgress {
    return {
        typedText: withIndentationFilled(passageContent, ''),
        startedAt: null,
        finishedAt: null,
    };
}

export function useTypingSession(passageContent: string): TypingSession {
    const [progress, setProgress] = useState<TypingProgress>(() => createProgress(passageContent));

    // A new passage is a new attempt. Resetting here rather than at every caller
    // means none of them can forget it, and this is the only place that already
    // holds the new text — whose first line has to be indented before the reader
    // touches a key.
    const [attemptedPassageContent, setAttemptedPassageContent] = useState(passageContent);
    if (attemptedPassageContent !== passageContent) {
        setAttemptedPassageContent(passageContent);
        setProgress(createProgress(passageContent));
    }

    const handleTypedTextChange = useCallback(
        (nextTypedText: string) => {
            setProgress((current) => {
                if (current.finishedAt !== null) {
                    return current;
                }
                // Typing past the end of the passage is not an error, it is the end.
                const clampedText = nextTypedText.slice(0, passageContent.length);
                const filledText = withIndentationFilled(passageContent, clampedText);
                const isComplete = filledText.length === passageContent.length;
                return {
                    typedText: filledText,
                    startedAt: current.startedAt ?? (filledText.length > 0 ? Date.now() : null),
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
        setProgress(createProgress(passageContent));
    }, [passageContent]);

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
