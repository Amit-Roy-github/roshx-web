import { useEffect, useRef } from 'react';
import { Card, Empty, EmptyDescription, EmptyHeader, Spinner, Textarea } from '@roshx/ui';
import { PassageFormat } from '@/products/practice/passage-format.enum';
import { PracticeWindowMode } from '@/products/practice/practice-window-mode.enum';
import { PassageText } from '@/products/practice/PassageText';
import type { TypingSession } from '@/products/practice/useTypingSession';
import type { Passage } from '@/products/practice/passage.types';

/** Long enough to describe anything worth practising, short enough to stay a subject. */
const SUBJECT_MAX_LENGTH = 500;

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
        <Card className="h-[17rem] w-full overflow-y-hidden border-6 px-5 py-2 bg-dark">
            <WindowContents {...props} />
        </Card>
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
        <Textarea
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
            maxLength={SUBJECT_MAX_LENGTH}
            placeholder={errorMessage ?? 'What do you want to practise?'}
            spellCheck={false}
            // Stripped back to bare text: a composer that fills its own panel
            // should look like the passage it is about to become, not like a
            // form control sitting inside a box.
            className="h-full resize-none border-none bg-transparent p-0 font-mono text-[1.05rem] leading-9 shadow-none focus-visible:ring-0 sm:text-[1.15rem] dark:bg-transparent"
        />
    );
}

function GeneratingState() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
            <Spinner label="Writing your passage" />
            <p className="text-sm text-muted-foreground">Writing your passage...</p>
        </div>
    );
}

function TypingSurface({ passage, session }: { passage: Passage | undefined; session: TypingSession }) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    // React points this at whichever character is next to type — see the ref on
    // PassageCharacter — so on a fresh passage it is already the first one.
    // PassageText measures it to decide how far to slide the text up.
    const activeCharacterRef = useRef<HTMLSpanElement>(null);

    useEffect(() => inputRef.current?.focus(), [passage?.id]);

    if (!passage) {
        return (
            // Empty brings its own padding for a full page; this one lives in a
            // card that already has its own, so it only borrows the centring.
            <Empty className="p-0">
                <EmptyHeader>
                    <EmptyDescription>
                        Hit <strong className="text-foreground">Generate test</strong> and say what you want
                        to practise. Anything at all.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        // Clicking anywhere on the passage puts the caret back where it belongs.
        <div onClick={() => inputRef.current?.focus()} className="relative cursor-text">
            <PassageText
                content={passage.content}
                typedText={session.typedText}
                format={passage.format ?? PassageFormat.PROSE}
                activeCharacterRef={activeCharacterRef}
            />
            {/*
              The real input, kept offscreen-small on purpose. A full-size
              invisible overlay would hold the same text in a different layout,
              and the browser scrolling to ITS caret is what used to yank the
              window out from under the reader. One pixel has nowhere to scroll.
            */}
            <textarea
                ref={inputRef}
                value={session.typedText}
                onChange={(event) => session.handleTypedTextChange(event.target.value)}
                className="pointer-events-none absolute top-0 left-0 h-px w-px resize-none border-none p-0 opacity-0"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
            />
        </div>
    );
}
