import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionButton } from '@/shared/components/ActionButton';
import {
    fetchPracticeConfigs,
    resetPracticeConfig,
    savePracticeConfig,
} from '@/products/practice/practiceConfigApi';
import type { PracticeConfig } from '@/products/practice/practice-config.types';

const CONFIGS_QUERY_KEY = ['practice-configs'];

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
        <section
            className="flex flex-col gap-3 rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--surface-window)', borderColor: 'var(--border-subtle)' }}
        >
            <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-mono text-sm">{config.key}</h2>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {config.updatedAt
                        ? `saved ${new Date(config.updatedAt).toLocaleString()}`
                        : 'using default'}
                </span>
            </div>

            <textarea
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full resize-y rounded-xl border px-4 py-3 font-mono text-[0.8rem] leading-6 outline-none"
                style={{
                    backgroundColor: 'var(--surface-page)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                }}
            />

            <div className="flex items-center gap-3">
                <ActionButton onClick={() => save.mutate()} isActive isDisabled={isBusy || isUnchanged}>
                    {save.isPending ? 'Saving...' : 'Save'}
                </ActionButton>
                <ActionButton onClick={() => reset.mutate()} isDisabled={isBusy || !config.updatedAt}>
                    Reset to default
                </ActionButton>
                {save.isError && <StatusLine isError>Save failed.</StatusLine>}
                {save.isSuccess && !save.isPending && isUnchanged && <StatusLine>Saved.</StatusLine>}
            </div>
        </section>
    );
}

function StatusLine({ children, isError = false }: { children: React.ReactNode; isError?: boolean }) {
    return (
        <p className="text-sm" style={{ color: isError ? 'var(--error-text)' : 'var(--text-muted)' }}>
            {children}
        </p>
    );
}
