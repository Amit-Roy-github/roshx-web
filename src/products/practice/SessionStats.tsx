import { cn } from '@roshx/ui';
import type { TypingSession } from '@/products/practice/useTypingSession';

/** Live score above the window: words per minute, accuracy, progress. */
export function SessionStats({ session }: { session: TypingSession }) {
    return (
        <div className="flex items-center gap-7 font-mono text-sm text-muted-foreground">
            <Stat label="timer" value={formatElapsed(session.elapsedSeconds)} isHighlighted={false} />
            <Stat label="wpm" value={String(session.wordsPerMinute)} isHighlighted={session.isComplete} />
            <Stat label="acc" value={`${session.accuracyPercentage}%`} isHighlighted={session.isComplete} />
        </div>
    );
}

/** Elapsed time as m:ss — a typing session is minutes long, never hours. */
function formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function Stat({ label, value, isHighlighted }: { label: string; value: string; isHighlighted: boolean }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className="text-xs">{label + ':'}</span>
            <span className={cn('text-lg', isHighlighted ? 'text-primary' : 'text-foreground')}>{value}</span>
        </span>
    );
}
