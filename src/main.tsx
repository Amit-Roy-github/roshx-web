import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '@/App';
import '@/index.css';

const queryClient = new QueryClient();

// The app starts in light mode unless the reader has already chosen a theme.
// Keeping this before React mounts avoids a dark-mode flash from the shared UI
// package's system-preference fallback.
if (!localStorage.getItem('roshx-theme')) {
    localStorage.setItem('roshx-theme', 'light');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element is missing from index.html');
}

createRoot(rootElement).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </StrictMode>,
);
