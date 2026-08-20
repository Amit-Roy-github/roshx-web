import { apiClient } from '@/shared/lib/apiClient';
import type { PracticeConfig } from '@/products/practice/practice-config.types';

const CONFIGS_PATH = '/roshx/practice/configs';

export async function fetchPracticeConfigs(): Promise<PracticeConfig[]> {
    const response = await apiClient.get<PracticeConfig[]>(CONFIGS_PATH);
    return response.data;
}

export async function savePracticeConfig(key: string, value: string): Promise<PracticeConfig> {
    const response = await apiClient.put<PracticeConfig>(`${CONFIGS_PATH}/${key}`, { value });
    return response.data;
}

/** Deleting a saved value restores the server's built-in default. */
export async function resetPracticeConfig(key: string): Promise<void> {
    await apiClient.delete(`${CONFIGS_PATH}/${key}`);
}
