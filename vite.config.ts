import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** The roshx API lives inside lal-ju-server, which listens on 3009 locally. */
const ROSHX_SERVER_DEV_URL = 'http://localhost:3009';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            // @roshx/ui is a symlinked file: dep with its own node_modules
            // (it needs one to build itself). Without these aliases esbuild
            // resolves through the symlink's real path and bundles a second
            // copy into the @roshx/ui prebundle, so every hook the kit calls
            // throws "Invalid hook call". react-hook-form is pinned for the
            // same reason one step further in: <FormField> reads the context
            // this app's useForm() published, and a second copy sees an empty
            // one. Pin all three to this app's copy.
            react: fileURLToPath(new URL('./node_modules/react', import.meta.url)),
            'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
            'react-hook-form': fileURLToPath(
                new URL('./node_modules/react-hook-form', import.meta.url),
            ),
        },
        dedupe: ['react', 'react-dom', 'react-hook-form'],
    },
    optimizeDeps: {
        // The shared packages are symlinked (file: deps) while unpublished.
        // Vite skips pre-bundling linked packages by default, which can end up
        // loading a second React copy. Drop this once they are on npm.
        include: ['@roshx/core', '@roshx/ui'],
    },
    server: {
        // 5174 is sh-web-notes, 5175 is sh-web-vidhya — this app takes the next one
        // so all three can run at once.
        port: 5176,
        proxy: {
            '/api': { target: ROSHX_SERVER_DEV_URL, changeOrigin: true },
        },
    },
});
