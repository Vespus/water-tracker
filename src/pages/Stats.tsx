import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Flame, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell, Tooltip,
} from 'recharts';
import { useWeekStats, useStreak, useMonthAverage, useWeekComparison } from '../hooks/useStats';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function Stats() {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);
  const { days, goalMl } = useWeekStats(weekOffset);
  const streak = useStreak();
  const monthAvg = useMonthAverage();
  const comparison = useWeekComparison();

  const weekTotal = days.reduce((s, d) => s + d.totalWaterEquivalentMl, 0);
  const weekDaysWithData = days.filter(d => d.hasData).length;
  const weekAvg = weekDaysWithData > 0 ? Math.round(weekTotal / weekDaysWithData) : 0;

  const chartData = days.map((d, i) => ({
    name: t(`history.${DAY_KEYS[i]}`),
    value: Math.round(d.totalWaterEquivalentMl),
    goalReached: d.goalReached,
    hasData: d.hasData,
  }));

  const comparisonIcon = comparison === 'better'
    ? <TrendingUp size={16} className="text-green-500" />
    : comparison === 'worse'
      ? <TrendingDown size={16} className="text-red-400" />
      : <Minus size={16} className="text-gray-400" />;

  const comparisonText = t(`stats.comparison_${comparison}`);

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BarChart3 size={24} className="text-blue-500" />
        {t('nav.stats')}
      </h1>

      {/* Streak */}
      {streak > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Flame size={28} className="text-orange-500" />
          <div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{streak}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('stats.streakLabel')}</div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('stats.weekAvg')}</div>
          <div className="text-lg font-bold">{weekAvg}</div>
          <div className="text-xs text-gray-400">ml</div>
        </div>
        <div className="bg-cyan-50 dark:bg-cyan-900/30 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('stats.monthAvg')}</div>
          <div className="text-lg font-bold">{monthAvg}</div>
          <div className="text-xs text-gray-400">ml</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('stats.vsLastWeek')}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {comparisonIcon}
            <span className="text-sm font-medium">{comparisonText}</span>
          </div>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          disabled={weekOffset === 0}
        >
          {weekOffset === 0 ? t('stats.thisWeek') : t('stats.backToThisWeek')}
        </button>
        <button
          onClick={() => setWeekOffset(o => o + 1)}
          disabled={weekOffset >= 0}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: number | undefined) => [`${v ?? 0} ml`, t('drink.waterEq')]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <ReferenceLine y={goalMl} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: t('stats.goal'), position: 'right', fontSize: 11 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={!entry.hasData ? '#e5e7eb' : entry.goalReached ? '#22c55e' : '#60a5fa'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
