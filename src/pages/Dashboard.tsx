import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard.today')}</h1>

      {/* Water Glass Progress */}
      <WaterGlass currentMl={totalWaterEquivalentMl} goalMl={settings.dailyGoalMl} />

      {/* Summary line */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-lg font-bold">{totalMl}</p>
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.totalMl')}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{totalWaterEquivalentMl}</p>
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.waterEquivalent')}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{entryCount}</p>
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.entries')}</p>
        </div>
      </div>

      {/* Quick Buttons */}
      <div>
        <p className="text-xs text-gray-400 uppercase font-semibold mb-2 text-center">{t('drink.quickAdd')}</p>
        <QuickButtons onAdded={nudge} />
      </div>

      {/* Add Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.98] transition-all"
      >
        <Plus size={20} />
        {t('drink.addDrink')}
      </button>

      {/* Today's log */}
      <DrinkLog />

      {/* Modal */}
      <AddDrinkModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={nudge} />
    </div>
  );
}
