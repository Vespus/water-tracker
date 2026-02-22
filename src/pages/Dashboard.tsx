import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Droplets } from 'lucide-react';
import WaterGlass from '../components/drink/WaterGlass';
import QuickButtons from '../components/drink/QuickButtons';
import AddDrinkModal from '../components/drink/AddDrinkModal';
import DrinkLog from '../components/drink/DrinkLog';
import { useTodaySummary } from '../hooks/useDrinks';
import { useSettings } from '../hooks/useSettings';

export default function Dashboard() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const { totalMl, totalWaterEquivalentMl, entryCount } = useTodaySummary();
  const { settings } = useSettings();
  const [, forceUpdate] = useState(0);
  const nudge = () => forceUpdate(n => n + 1);

  const pct = Math.min(100, Math.round((totalWaterEquivalentMl / settings.dailyGoalMl) * 100));
  const remaining = Math.max(0, settings.dailyGoalMl - totalWaterEquivalentMl);

  return (
    <div className="page-enter pb-6">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Droplets size={22} className="text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.today')}</h1>
        </div>
        {pct < 100 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('dashboard.remaining', { amount: remaining })}
          </p>
        ) : (
          <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-0.5">🎉 {t('dashboard.goal')} erreicht!</p>
        )}
      </div>

      {/* Water Glass */}
      <div className="px-5">
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <WaterGlass currentMl={totalWaterEquivalentMl} goalMl={settings.dailyGoalMl} />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 px-5 mt-4">
        <div className="flex-1 bg-white dark:bg-gray-800/60 rounded-2xl p-3.5 text-center shadow-sm border border-gray-100 dark:border-gray-700/50">
          <p className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{totalMl}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.totalMl')}</p>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800/60 rounded-2xl p-3.5 text-center shadow-sm border border-gray-100 dark:border-gray-700/50">
          <p className="text-xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400">{totalWaterEquivalentMl}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.waterEquivalent')}</p>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800/60 rounded-2xl p-3.5 text-center shadow-sm border border-gray-100 dark:border-gray-700/50">
          <p className="text-xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{entryCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.entries')}</p>
        </div>
      </div>

      {/* Quick Buttons */}
      <div className="px-5 mt-5">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wider mb-3">
          {t('drink.quickAdd')}
        </p>
        <QuickButtons onAdded={nudge} />
      </div>

      {/* Add Button */}
      <div className="px-5 mt-4">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all duration-150"
        >
          <Plus size={20} strokeWidth={2.5} />
          {t('drink.addDrink')}
        </button>
      </div>

      {/* Today's log */}
      <div className="px-5 mt-6">
        <DrinkLog />
      </div>

      {/* Modal */}
      <AddDrinkModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={nudge} />
    </div>
  );
}
