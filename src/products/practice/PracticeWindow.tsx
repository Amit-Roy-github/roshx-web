import { useEffect, useRef } from 'react';
import { PassageFormat } from '@/products/practice/passage-format.enum';
import { PracticeWindowMode } from '@/products/practice/practice-window-mode.enum';
import { PassageText } from '@/products/practice/PassageText';
import type { TypingSession } from '@/products/practice/useTypingSession';
import type { Passage } from '@/products/practice/passage.types';

interface PracticeWindowProps {
    mode: PracticeWindowMode;
    passage: Passage | undefined;
    session: TypingSession;
    composerText: string;
    onComposerTextChange: (nextText: string) => void;
    onComposerSubmit: () => void;
    errorMessage: string | undefined;
}

/**
 * The one window everything happens in.
 *
 * Asking for a subject, waiting for the model, and typing are three faces of
 * the same panel — never three screens — so the reader's eyes never have to move
 * and nothing ever navigates.
 */
export function PracticeWindow(props: PracticeWindowProps) {
    return (
        // Fixed height, not a minimum: the three modes hold different amounts of
        // text, and a window that resized as they swapped would shift the page
        // under the reader mid-sentence. Anything taller scrolls inside.
        <section
            className="h-[22rem] overflow-y-auto rounded-2xl border px-6 py-7 shadow-sm sm:h-[24rem] sm:px-9 sm:py-9"
            style={{
                backgroundColor: 'var(--surface-window)',
                borderColor: 'var(--border-subtle)',
            }}
        >
            <WindowContents {...props} />
        </section>
    );
}

function WindowContents({
    mode,
    passage,
    session,
    composerText,
    onComposerTextChange,
    onComposerSubmit,
    errorMessage,
}: PracticeWindowProps) {
    switch (mode) {
        case PracticeWindowMode.COMPOSING:
            return (
                <SubjectComposer
                    composerText={composerText}
                    onComposerTextChange={onComposerTextChange}
                    onComposerSubmit={onComposerSubmit}
                    errorMessage={errorMessage}
                />
            );
        case PracticeWindowMode.GENERATING:
            return <GeneratingState />;
        case PracticeWindowMode.TYPING:
            return <TypingSurface passage={passage} session={session} />;
    }
}

interface SubjectComposerProps {
    composerText: string;
    onComposerTextChange: (nextText: string) => void;
    onComposerSubmit: () => void;
    errorMessage: string | undefined;
}

function SubjectComposer({
    composerText,
    onComposerTextChange,
    onComposerSubmit,
    errorMessage,
}: SubjectComposerProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => textareaRef.current?.focus(), []);

    return (
        <textarea
            ref={textareaRef}
            value={composerText}
            onChange={(event) => onComposerTextChange(event.target.value)}
            onKeyDown={(event) => {
                // Enter sends; Shift+Enter is for people who want a second line.
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onComposerSubmit();
                }
            }}
            maxLength={500}
            placeholder={errorMessage ?? 'What do you want to practise?'}
            spellCheck={false}
            className="h-full w-full resize-none border-none bg-transparent p-0 font-mono text-[1.05rem] leading-9 outline-none sm:text-[1.15rem]"
            style={{ color: 'var(--text-primary)' }}
        />
    );
}

function GeneratingState() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
            <span
                className="h-7 w-7 animate-spin rounded-full border-2 border-transparent"
                style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--accent)' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Writing your passage...
            </p>
        </div>
    );
}

function TypingSurface({ passage, session }: { passage: Passage | undefined; session: TypingSession }) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => inputRef.current?.focus(), [passage?.id]);

    if (!passage) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="max-w-sm text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Hit <strong style={{ color: 'var(--text-primary)' }}>Generate test</strong> and say what
                    you want to practise. Anything at all.
                </p>
            </div>
        );
    }

    return (
        // Clicking anywhere on the passage puts the caret back where it belongs.
        <div onClick={() => inputRef.current?.focus()} className="relative cursor-text">
            <p className="mb-4 text-xs tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                {passage.title}
            </p>
            <PassageText
                content={passage.content}
                typedText={session.typedText}
                format={passage.format ?? PassageFormat.PROSE}
            />
            {/* The real input, invisible over the passage — keeps mobile keyboards working. */}
            <textarea
                ref={inputRef}
                value={session.typedText}
                onChange={(event) => session.handleTypedTextChange(event.target.value)}
                className="absolute inset-0 h-full w-full cursor-text resize-none opacity-0"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
            />
        </div>
    );
}
