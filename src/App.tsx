import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTheme } from '@roshx/ui';
import { AccountPage } from '@/shared/auth/AccountPage';
import { AppHeader } from '@/shared/components/AppHeader';
import { AdminPage } from '@/products/practice/AdminPage';
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
            <div className="min-h-dvh">
                <AppHeader theme={theme} onToggleTheme={toggleTheme} />
                <Routes>
                    <Route path={RoutePath.HOME} element={<AccountPage />} />
                    <Route path={RoutePath.PRACTICE} element={<PracticePage />} />
                    <Route path={RoutePath.ADMIN} element={<AdminPage />} />
                    <Route path="*" element={<Navigate to={DEFAULT_ROUTE_PATH} replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
