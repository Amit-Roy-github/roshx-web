import { z } from 'zod';

/**
 * Every environment variable this app reads, validated once at startup.
 *
 * Reading `import.meta.env` anywhere else is a bug: a typo there fails silently
 * at runtime, whereas a missing value here fails loudly on boot.
 */
const environmentSchema = z.object({
    /** Empty in dev so requests go to '/api' and Vite proxies them to the server. */
    VITE_API_BASE_URL: z.string().default('/api'),
});

const parsedEnvironment = environmentSchema.safeParse(import.meta.env);

if (!parsedEnvironment.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsedEnvironment.error)}`);
}

export const environment = parsedEnvironment.data;
