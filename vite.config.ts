import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** The roshx API lives inside lal-ju-server, which listens on 3001 locally. */
const ROSHX_SERVER_DEV_URL = 'http://localhost:3009';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
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
