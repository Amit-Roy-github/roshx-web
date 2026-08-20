import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ActionButton } from '@/shared/components/ActionButton';
import { PracticeWindowMode } from '@/products/practice/practice-window-mode.enum';
import { fetchOpeningPassage, generatePassage } from '@/products/practice/passageApi';
import { PracticeWindow } from '@/products/practice/PracticeWindow';
import { SessionStats } from '@/products/practice/SessionStats';
import { useTypingSession } from '@/products/practice/useTypingSession';
import type { Passage } from '@/products/practice/passage.types';

const GENERATION_FAILED_MESSAGE = 'Could not write that one. Try rephrasing it.';

/**
 * The whole app: one window, three buttons.
 *
 * The page owns which mode the window is in and which passage is loaded;
 * everything below it just renders what it is given.
 */
export function PracticePage() {
    const [mode, setMode] = useState<PracticeWindowMode>(PracticeWindowMode.TYPING);
    const [generatedPassage, setGeneratedPassage] = useState<Passage | undefined>(undefined);
    const [composerText, setComposerText] = useState('');
    const [lastRequestedSubject, setLastRequestedSubject] = useState('');

    // Something to type the moment the page opens, picked from what already
    // exists — an empty window gives a first-time visitor nothing to do, and
    // generating for them would cost ten seconds they did not ask for.
    const openingPassageQuery = useQuery({
        queryKey: ['opening-passage'],
        queryFn: fetchOpeningPassage,
        staleTime: Number.POSITIVE_INFINITY,
    });

    // What the reader made themselves always wins over what they were handed.
    const passage = generatedPassage ?? openingPassageQuery.data ?? undefined;
    const session = useTypingSession(passage?.content ?? '');

    const generation = useMutation({
        mutationFn: generatePassage,
        onMutate: () => setMode(PracticeWindowMode.GENERATING),
        onSuccess: (newPassage) => {
            setGeneratedPassage(newPassage);
            session.restart();
            setMode(PracticeWindowMode.TYPING);
        },
        onError: () => setMode(PracticeWindowMode.COMPOSING),
    });

    const requestPassage = (subject: string) => {
        const trimmedSubject = subject.trim();
        if (trimmedSubject.length === 0) {
            return;
        }
        setLastRequestedSubject(trimmedSubject);
        generation.mutate(trimmedSubject);
    };

    /** Same subject, new passage — the server is told what it already wrote. */
    const startNewTest = () => {
        if (lastRequestedSubject.length === 0) {
            setMode(PracticeWindowMode.COMPOSING);
            return;
        }
        requestPassage(lastRequestedSubject);
    };

    /**
     * One button, two jobs: open the composer, then send what was written in it.
     *
     * Making it toggle back instead would throw away the subject the reader just
     * typed, which is exactly what it looks like when nothing happens.
     */
    const handleGenerateClick = () => {
        if (mode !== PracticeWindowMode.COMPOSING) {
            setMode(PracticeWindowMode.COMPOSING);
            return;
        }
        requestPassage(composerText);
    };

    const isGenerating = mode === PracticeWindowMode.GENERATING;
    const isComposing = mode === PracticeWindowMode.COMPOSING;

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 pt-8 pb-16 sm:pt-14">
            <div className="flex items-end justify-between">
                <SessionStats session={session} totalCharacters={passage?.content.length ?? 0} />
            </div>

            <PracticeWindow
                mode={mode}
                passage={passage}
                session={session}
                composerText={composerText}
                onComposerTextChange={setComposerText}
                onComposerSubmit={() => requestPassage(composerText)}
                errorMessage={generation.isError ? GENERATION_FAILED_MESSAGE : undefined}
            />

            <div className="flex flex-wrap justify-center gap-3">
                <ActionButton onClick={startNewTest} isDisabled={isGenerating}>
                    New test
                </ActionButton>
                <ActionButton onClick={session.restart} isDisabled={isGenerating || !passage}>
                    Restart test
                </ActionButton>
                <ActionButton
                    onClick={handleGenerateClick}
                    isActive={mode === PracticeWindowMode.COMPOSING}
                    isDisabled={isGenerating || (isComposing && composerText.trim().length === 0)}
                >
                    {isComposing ? 'Generate' : 'Generate test'}
                </ActionButton>
            </div>
        </main>
    );
}
