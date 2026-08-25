import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { pickRandomItem } from '@roshx/core';
import { AppButton } from '@/shared/components/AppButton';
import { PracticeWindowMode } from '@/products/practice/practice-window-mode.enum';
import { fetchRecentPassages, generatePassage } from '@/products/practice/passageApi';
import { PracticeWindow } from '@/products/practice/PracticeWindow';
import { SessionStats } from '@/products/practice/SessionStats';
import { useAttemptReporter } from '@/products/practice/useAttemptReporter';
import { useTypingSession } from '@/products/practice/useTypingSession';
import type { Passage } from '@/products/practice/passage.types';

const GENERATION_FAILED_MESSAGE = 'Could not write that one. Try rephrasing it.';
const RECENT_PASSAGES_QUERY_KEY = ['recent-passages'];

/**
 * The whole app: one window, three buttons.
 *
 * The page owns which mode the window is in and which passage is loaded;
 * everything below it just renders what it is given.
 */
export function PracticePage() {
    const [mode, setMode] = useState<PracticeWindowMode>(PracticeWindowMode.TYPING);
    const [passage, setPassage] = useState<Passage | undefined>(undefined);
    const [composerText, setComposerText] = useState('');
    const [lastRequestedSubject, setLastRequestedSubject] = useState('');

    // The pool is fetched once and never again: these are passages other people
    // already wrote, and nothing about them changes while the page is open.
    const recentPassagesQuery = useQuery({
        queryKey: RECENT_PASSAGES_QUERY_KEY,
        queryFn: fetchRecentPassages,
        staleTime: Number.POSITIVE_INFINITY,
    });
    const recentPassages = recentPassagesQuery.data;

    const session = useTypingSession(passage?.content ?? '');
    useAttemptReporter(passage?.id, session);

    // pickRandomItem reports "nothing to pick" as null; this page speaks
    // undefined, so the two meet here rather than at every call site.
    const showAnotherPassage = () => {
        setPassage(pickRandomItem(recentPassages ?? []) ?? undefined);
    };

    // Something to type the moment the pool arrives. Depends on the data alone:
    // depending on `passage` would loop, since this is what sets it.
    useEffect(() => {
        showAnotherPassage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recentPassages]);

    const generation = useMutation({
        mutationFn: generatePassage,
        onMutate: () => setMode(PracticeWindowMode.GENERATING),
        onSuccess: (newPassage) => {
            setPassage(newPassage);
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
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 pt-8 pb-16 sm:pt-14">
            <div className="flex items-end justify-between">
                <SessionStats session={session} />
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
                <AppButton onClick={session.restart} isDisabled={isGenerating || !passage}>
                    Restart
                </AppButton>
                <AppButton onClick={showAnotherPassage}>Next</AppButton>
                <AppButton onClick={startNewTest} isDisabled={isGenerating}>
                    New test
                </AppButton>
                {mode === PracticeWindowMode.COMPOSING ? (
                    <AppButton
                        onClick={handleGenerateClick}
                        isActive={mode === PracticeWindowMode.COMPOSING}
                        isDisabled={isGenerating || (isComposing && composerText.trim().length === 0)}
                    >
                        Generate
                    </AppButton>
                ) : (
                    false
                )}
            </div>
        </main>
    );
}
