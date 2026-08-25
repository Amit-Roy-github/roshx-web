import { useCallback, useEffect, useRef } from 'react';
import { reportAttempt } from '@/products/practice/attemptApi';
import type { TypingSession } from '@/products/practice/useTypingSession';

/**
 * How often a run in progress checks in.
 *
 * Long enough that a room full of readers is not a write per person every few
 * seconds, short enough that "who is typing right now" stays a fair question to
 * ask of the answer.
 */
const REPORT_INTERVAL_MS = 15_000;

/**
 * Tells the server that somebody is typing, and keeps telling it.
 *
 * The point is the reader who only ever types — never generates anything, never
 * signs in. Ownership on a passage cannot see them, because they never made
 * one; only a run they are in the middle of can.
 *
 * Nothing is reported when they leave. A closed tab, a locked phone and a
 * crashed browser all look identical from here and none of them can send a
 * parting message, so an abandoned run is the one that simply stopped checking
 * in — which the server can see for itself.
 */
export function useAttemptReporter(passageId: string | undefined, session: TypingSession): void {
    // The interval fires long after the effect was set up, and the cleanup runs
    // once the passage has already changed. Both want what the session holds
    // when they run, so they read it from here rather than from a closure.
    const latestSessionRef = useRef(session);
    useEffect(() => {
        latestSessionRef.current = session;
    });

    const reportedCharacterCountRef = useRef(0);

    const sendReport = useCallback((reportedPassageId: string) => {
        const latestSession = latestSessionRef.current;
        reportedCharacterCountRef.current = latestSession.cursorIndex;
        reportAttempt({
            attemptId: latestSession.attemptId,
            passageId: reportedPassageId,
            charactersTyped: latestSession.cursorIndex,
            wordsPerMinute: latestSession.wordsPerMinute,
            accuracyPercentage: latestSession.accuracyPercentage,
            isComplete: latestSession.isComplete,
            // Swallowed on purpose. This is bookkeeping the reader never asked
            // for; a dropped report costs a row in a count, and interrupting
            // somebody mid-passage to say so would cost far more.
        }).catch(() => undefined);
    }, []);

    // A run begins at the first keystroke, not when the passage loads: somebody
    // who opens the page and leaves has not attempted anything, and a row for
    // them would only make the count flattering.
    useEffect(() => {
        if (!passageId || !session.hasStarted) {
            return;
        }
        sendReport(passageId);

        const intervalId = setInterval(() => {
            // Silence is not the same as leaving, but it is not typing either.
            // Somebody sitting on a finished screen writes nothing.
            if (latestSessionRef.current.cursorIndex !== reportedCharacterCountRef.current) {
                sendReport(passageId);
            }
        }, REPORT_INTERVAL_MS);

        // Restart, Next, Generate, or leaving the page — every way a run can end
        // early arrives here, because all of them change the attempt.
        return () => {
            clearInterval(intervalId);
            sendReport(passageId);
        };
    }, [passageId, session.attemptId, session.hasStarted, sendReport]);

    // Finishing is worth saying immediately rather than at the next interval,
    // since it is the one report the reader might act on — a score they expect
    // to see counted.
    useEffect(() => {
        if (!passageId || !session.isComplete) {
            return;
        }
        sendReport(passageId);
    }, [passageId, session.isComplete, sendReport]);
}
