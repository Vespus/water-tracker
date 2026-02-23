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
      {/* ── Header ── compact on mobile */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Droplets size={20} className="text-blue-500 flex-shrink-0" />
          <h1 className="text-xl font-bold tracking-tight">{t('dashboard.today')}</h1>
        </div>
        {pct < 100 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.remaining', { amount: remaining })}
          </p>
        ) : (
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            🎉 {t('dashboard.goal')} erreicht!
          </p>
        )}
      </div>

      {/* ── Glass + Stats (side by side) ── */}
      <div className="px-4 mt-1">
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
          {/* Compact glass */}
          <div className="flex-shrink-0">
            <WaterGlass compact currentMl={totalWaterEquivalentMl} goalMl={settings.dailyGoalMl} />
          </div>

          {/* Stats: 3 rows stacked */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{t('dashboard.totalMl')}</p>
              <p className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400 flex-shrink-0">{totalMl} <span className="text-[10px] font-normal text-gray-400">ml</span></p>
            </div>
            <div className="flex items-center justify-between gap-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{t('dashboard.waterEquivalent')}</p>
              <p className="text-sm font-bold tabular-nums text-cyan-600 dark:text-cyan-400 flex-shrink-0">{totalWaterEquivalentMl} <span className="text-[10px] font-normal text-gray-400">ml</span></p>
            </div>
            <div className="flex items-center justify-between gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{t('dashboard.entries')}</p>
              <p className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400 flex-shrink-0">{entryCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Favoriten / Quick Buttons ── */}
      <div className="px-4 mt-3">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wider mb-2">
          {t('drink.quickAdd')}
        </p>
        <QuickButtons onAdded={nudge} />
      </div>

      {/* ── Add Button ── */}
      <div className="px-4 mt-3">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all duration-150"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t('drink.addDrink')}
        </button>
      </div>

      {/* ── Today's log (below fold is fine) ── */}
      <div className="px-4 mt-5">
        <DrinkLog />
      </div>

      {/* Modal */}
      <AddDrinkModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={nudge} />
    </div>
  );
}
