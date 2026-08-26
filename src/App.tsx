import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTheme } from '@roshx/ui';
import { AccountPage } from '@/shared/auth/AccountPage';
import { AppHeader } from '@/shared/components/AppHeader';
import { AdminPage } from '@/products/practice/AdminPage';
import { NotesPage } from '@/products/notes/NotesPage';
import { PracticePage } from '@/products/practice/PracticePage';
import { DEFAULT_ROUTE_PATH, RoutePath } from '@/routes/routePaths';

/**
 * The roshx site shell.
 *
 * One header, one route per product. Notes will add a single line here and a
 * folder under products/ — nothing else about this file has to change.
 */
export function App() {
    const { theme, toggleTheme } = useTheme();

    return (
        <BrowserRouter>
            {/* A capped column, so a page can hand its own panes the scrollbar
                instead of the window — which is what notes does. Anything that
                just grows, like practice, scrolls in the wrapper and looks
                exactly as it did. */}
            <div className="flex h-dvh flex-col">
                <AppHeader theme={theme} onToggleTheme={toggleTheme} />
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    <Routes>
                        <Route path={RoutePath.HOME} element={<AccountPage />} />
                        <Route path={RoutePath.PRACTICE} element={<PracticePage />} />
                        <Route path={RoutePath.NOTES} element={<NotesPage />} />
                        <Route path={RoutePath.ADMIN} element={<AdminPage />} />
                        <Route path="*" element={<Navigate to={DEFAULT_ROUTE_PATH} replace />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}
