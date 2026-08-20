import { useEffect, useState } from 'react';
import { Theme } from '@/shared/enums/theme.enum';

const STORAGE_KEY = 'roshx-theme';

function readInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === Theme.LIGHT || stored === Theme.DARK) {
        return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
}

/** Owns the theme: remembers the choice, and keeps <html> in sync with it. */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
    const [theme, setTheme] = useState<Theme>(readInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === Theme.DARK);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    return {
        theme,
        toggleTheme: () => setTheme((current) => (current === Theme.DARK ? Theme.LIGHT : Theme.DARK)),
    };
}
