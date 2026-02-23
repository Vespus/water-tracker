import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Droplets } from 'lucide-react';
import ProgressRing from '../components/drink/ProgressRing';
import QuickButtons from '../components/drink/QuickButtons';
import AddDrinkModal from '../components/drink/AddDrinkModal';
import DrinkLog from '../components/drink/DrinkLog';
import WaveDecoration from '../components/drink/WaveDecoration';
import { useTodaySummary } from '../hooks/useDrinks';
import { useSettings } from '../hooks/useSettings';

export default function Dashboard() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const { totalMl, totalWaterEquivalentMl } = useTodaySummary();
  const { settings } = useSettings();
  const [, forceUpdate] = useState(0);
  const nudge = () => forceUpdate(n => n + 1);

  const pct = Math.min(100, Math.round((totalWaterEquivalentMl / settings.dailyGoalMl) * 100));
  const remaining = Math.max(0, settings.dailyGoalMl - totalWaterEquivalentMl);
  const difference = Math.abs(settings.dailyGoalMl - totalWaterEquivalentMl);

  return (
    <div className="page-enter pb-6">
      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        {/* Left: icon + "Heute" + "Noch X ml" */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Droplets size={20} className="text-cyan-200 flex-shrink-0" />
            <h1 className="text-xl font-bold tracking-tight text-white">{t('dashboard.today')}</h1>
          </div>
          {pct < 100 ? (
            <p className="text-xs text-blue-200">
              {t('dashboard.remaining', { amount: remaining })}
            </p>
          ) : (
            <p className="text-xs font-medium text-cyan-200">
              🎉 {t('dashboard.goalReached')}
            </p>
          )}
        </div>

        {/* Right: total ml badge/pill */}
        <div className="flex-shrink-0">
          <span className="text-xs font-semibold text-cyan-100 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
            {t('dashboard.totalBadge', { amount: totalMl })}
          </span>
        </div>
      </div>

      {/* ── Hero: Progress Ring ── */}
      <div className="flex justify-center mt-2 mb-1">
        <ProgressRing
          currentMl={totalWaterEquivalentMl}
          goalMl={settings.dailyGoalMl}
          totalMl={totalMl}
          waterEquivalentMl={totalWaterEquivalentMl}
        />
      </div>

      {/* ── Schnelleingabe ── */}
      <div className="px-4 mt-3">
        <p className="text-[11px] text-blue-200/70 uppercase font-semibold tracking-wider mb-2">
          {t('drink.quickAdd')}
        </p>
        <QuickButtons onAdded={nudge} grid maxItems={4} />
      </div>

      {/* ── CTA Button ── */}
      <div className="px-4 mt-3">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-black/10 transition-all duration-150"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t('drink.addDrink')}
        </button>
      </div>

      {/* ── Footer info ── */}
      <div className="px-4 mt-2 flex items-center justify-center gap-3">
        <span className="text-[11px] text-blue-200/50">
          {t('dashboard.goalInfo', { amount: settings.dailyGoalMl })}
        </span>
        <span className="text-blue-200/30">·</span>
        <span className="text-[11px] text-blue-200/50">
          {t('dashboard.differenceInfo', { amount: difference })}
        </span>
      </div>

      {/* ── Wave decoration ── */}
      <WaveDecoration />

      {/* ── Today's log (below fold) ── */}
      <div className="px-4 mt-1">
        <DrinkLog />
      </div>

      {/* Modal */}
      <AddDrinkModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={nudge} />
    </div>
  );
}
