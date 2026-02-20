import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { LayoutDashboard, History, BarChart3, Settings } from 'lucide-react';
import Dashboard from '../pages/Dashboard';
import HistoryPage from '../pages/History';
import Stats from '../pages/Stats';
import SettingsPage from '../pages/Settings';
import Onboarding from '../pages/Onboarding';

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

export default function App() {
  const { t } = useTranslation();
  const { currentPage, setCurrentPage } = useAppStore();
  const Page = pages[currentPage];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full">
        <Page />
      </main>
      <nav className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                currentPage === id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
