import { z } from 'zod';

/**
 * Every environment variable this app reads, validated once at startup.
 *
 * Reading `import.meta.env` anywhere else is a bug: a typo there fails silently
 * at runtime, whereas a missing value here fails loudly on boot.
 */
/**
 * The OAuth client roshx signs people in with.
 *
 * Written here rather than injected at build time: `gcloud run deploy --source`
 * builds the image on Cloud Build, where a VITE_ variable from the workflow
 * never reaches. That is safe — an OAuth client id is a public identifier, it
 * ships inside the page either way, and the same value already sits in plain
 * text in both server and notes deploy workflows.
 *
 * The secret half never leaves the server, and the id is only usable from the
 * origins listed on the client in Google Cloud console.
 */
const GOOGLE_CLIENT_ID = '585155743911-df0t1q3dfa68fvj5d568bul7v8v43l5p.apps.googleusercontent.com';

const environmentSchema = z.object({
    /** Empty in dev so requests go to '/api' and Vite proxies them to the server. */
    VITE_API_BASE_URL: z.string().default('/api'),
    /** Overridable so a fork can point at its own OAuth client without a code change. */
    VITE_GOOGLE_CLIENT_ID: z.string().default(GOOGLE_CLIENT_ID),
});

const parsedEnvironment = environmentSchema.safeParse(import.meta.env);

if (!parsedEnvironment.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsedEnvironment.error)}`);
}

export const environment = parsedEnvironment.data;
