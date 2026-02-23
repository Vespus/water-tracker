import { Component, type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import type { ThemePreference } from '../types';

class ErrorBoundary extends Component<{children: ReactNode}, {error: string|null}> {
  state = { error: null as string|null };
  static getDerivedStateFromError(error: any) {
    return { error: `${error?.name || 'Error'}: ${error?.message || String(error)}${error?.inner ? ' | inner: ' + error.inner.message : ''}` };
  }
  render() {
    if (this.state.error) return <pre style={{padding: 20, color: 'red', whiteSpace: 'pre-wrap'}}>{this.state.error}</pre>;
    return this.props.children;
  }
}
import { LayoutDashboard, History, BarChart3, Settings } from 'lucide-react';
import Dashboard from '../pages/Dashboard';
import HistoryPage from '../pages/History';
import Stats from '../pages/Stats';
import SettingsPage from '../pages/Settings';
import Onboarding from '../pages/Onboarding';
import { useSettings } from '../hooks/useSettings';

const pages = {
  dashboard: Dashboard,
  history: HistoryPage,
  stats: Stats,
  settings: SettingsPage,
  onboarding: Onboarding,
} as const;

const navItems = [
  { id: 'dashboard' as const, icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { id: 'history' as const, icon: History, labelKey: 'nav.history' },
  { id: 'stats' as const, icon: BarChart3, labelKey: 'nav.stats' },
  { id: 'settings' as const, icon: Settings, labelKey: 'nav.settings' },
];

function useTheme(theme: ThemePreference) {
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      return;
    }
    if (theme === 'light') {
      root.classList.remove('dark');
      return;
    }

    // 'system': follow OS preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystem = (dark: boolean) => {
      if (dark) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    applySystem(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => applySystem(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);
}

export default function App() {
  const { t } = useTranslation();
  const { currentPage, setCurrentPage } = useAppStore();
  const { settings } = useSettings();

  useTheme(settings.theme ?? 'system');

  // Show onboarding on first start
  const showOnboarding = !settings.onboardingCompleted && currentPage !== 'onboarding';
  const Page = showOnboarding ? Onboarding : pages[currentPage];

  return (
    <div className="app-bg text-gray-900 dark:text-gray-100 flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full">
        <ErrorBoundary><Page /></ErrorBoundary>
      </main>

      {!showOnboarding && (
        <nav className="nav-glass sticky bottom-0 safe-area-bottom">
          <div className="max-w-lg mx-auto flex justify-around py-1.5 px-2">
            {navItems.map(({ id, icon: Icon, labelKey }) => {
              const active = currentPage === id;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentPage(id)}
                  className={`relative flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-white/15 transition-all duration-200" />
                  )}
                  <Icon size={20} className="relative" />
                  <span className="relative">{t(labelKey)}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
