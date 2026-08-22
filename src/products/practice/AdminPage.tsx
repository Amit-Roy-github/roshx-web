import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, cn, Textarea } from '@roshx/ui';
import { AppButton } from '@/shared/components/AppButton';
import {
    fetchPracticeConfigs,
    resetPracticeConfig,
    savePracticeConfig,
} from '@/products/practice/practiceConfigApi';
import type { PracticeConfig } from '@/products/practice/practice-config.types';

const CONFIGS_QUERY_KEY = ['practice-configs'];

/** Tall enough to read a whole system prompt without scrolling it in a slot. */
const PROMPT_EDITOR_ROWS = 18;

/**
 * The settings behind practice — today, the prompt the generator runs on.
 *
 * Reachable only by URL: it is not in the header because it is not part of what
 * a reader does here.
 */
export function AdminPage() {
    const configsQuery = useQuery({ queryKey: CONFIGS_QUERY_KEY, queryFn: fetchPracticeConfigs });

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-8 pb-16">
            <h1 className="text-xl font-semibold tracking-tight">Practice settings</h1>

            {configsQuery.isPending && <StatusLine>Loading...</StatusLine>}
            {configsQuery.isError && <StatusLine isError>Could not reach the server.</StatusLine>}

            {configsQuery.data?.map((config) => (
                <ConfigEditor key={config.key} config={config} />
            ))}
        </main>
    );
}

function ConfigEditor({ config }: { config: PracticeConfig }) {
    const queryClient = useQueryClient();
    const [draftValue, setDraftValue] = useState(config.value);

    const invalidateConfigs = () => queryClient.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY });

    const save = useMutation({
        mutationFn: () => savePracticeConfig(config.key, draftValue),
        onSuccess: invalidateConfigs,
    });
    const reset = useMutation({
        mutationFn: () => resetPracticeConfig(config.key),
        onSuccess: async () => {
            await invalidateConfigs();
            // The server answers with no body, so pull the restored default back
            // into the box the admin is looking at.
            const [restored] = (await queryClient.getQueryData<PracticeConfig[]>(CONFIGS_QUERY_KEY)) ?? [];
            if (restored) {
                setDraftValue(restored.value);
            }
        },
    });

    const isBusy = save.isPending || reset.isPending;
    const isUnchanged = draftValue.trim() === config.value.trim();

    return (
        <Card className="gap-3 p-5">
            <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-mono text-sm">{config.key}</h2>
                <span className="text-xs text-muted-foreground">
                    {config.updatedAt
                        ? `saved ${new Date(config.updatedAt).toLocaleString()}`
                        : 'using default'}
                </span>
            </div>

            <Textarea
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                rows={PROMPT_EDITOR_ROWS}
                spellCheck={false}
                className="resize-y bg-background font-mono text-[0.8rem] leading-6 dark:bg-background"
            />

            <div className="flex items-center gap-3">
                <AppButton onClick={() => save.mutate()} isActive isDisabled={isBusy || isUnchanged}>
                    {save.isPending ? 'Saving...' : 'Save'}
                </AppButton>
                <AppButton onClick={() => reset.mutate()} isDisabled={isBusy || !config.updatedAt}>
                    Reset to default
                </AppButton>
                {save.isError && <StatusLine isError>Save failed.</StatusLine>}
                {save.isSuccess && !save.isPending && isUnchanged && <StatusLine>Saved.</StatusLine>}
            </div>
        </Card>
    );
}

function StatusLine({ children, isError = false }: { children: React.ReactNode; isError?: boolean }) {
    return (
        <p className={cn('text-sm', isError ? 'text-destructive' : 'text-muted-foreground')}>{children}</p>
    );
}
