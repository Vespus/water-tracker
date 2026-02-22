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

  const comparisonConfig = {
    better: { icon: <TrendingUp size={15} className="text-green-500" />, text: t('stats.comparison_better'), color: 'text-green-600 dark:text-green-400' },
    worse:  { icon: <TrendingDown size={15} className="text-red-400" />, text: t('stats.comparison_worse'),  color: 'text-red-500 dark:text-red-400' },
    equal:  { icon: <Minus size={15} className="text-gray-400" />,       text: t('stats.comparison_equal'),  color: 'text-gray-500 dark:text-gray-400' },
  }[comparison];

  return (
    <div className="page-enter pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} className="text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">{t('nav.stats')}</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Streak card */}
        {streak > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-3xl p-5 border border-orange-100 dark:border-orange-800/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
              <Flame size={24} className="text-orange-500" />
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">{streak}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('stats.streakLabel')}</div>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3.5 text-center border border-blue-100 dark:border-blue-800/30">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('stats.weekAvg')}</div>
            <div className="text-xl font-bold tabular-nums text-blue-700 dark:text-blue-300">{weekAvg}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">ml</div>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-3.5 text-center border border-cyan-100 dark:border-cyan-800/30">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('stats.monthAvg')}</div>
            <div className="text-xl font-bold tabular-nums text-cyan-700 dark:text-cyan-300">{monthAvg}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">ml</div>
          </div>
          <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-3.5 text-center border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('stats.vsLastWeek')}</div>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              {comparisonConfig.icon}
              <span className={`text-xs font-semibold ${comparisonConfig.color}`}>{comparisonConfig.text}</span>
            </div>
          </div>
        </div>

        {/* Chart card */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="text-sm font-semibold text-blue-500 dark:text-blue-400 hover:underline disabled:text-gray-400 disabled:no-underline transition-colors"
              disabled={weekOffset === 0}
            >
              {weekOffset === 0 ? t('stats.thisWeek') : t('stats.backToThisWeek')}
            </button>
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              disabled={weekOffset >= 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v: number | undefined) => [`${v ?? 0} ml`, t('drink.waterEq')]}
                contentStyle={{
                  borderRadius: 12,
                  fontSize: 12,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}
              />
              <ReferenceLine
                y={goalMl}
                stroke="#3b82f6"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{ value: t('stats.goal'), position: 'right', fontSize: 11, fill: '#3b82f6' }}
              />
              <Bar dataKey="value" radius={[6, 6, 3, 3]} maxBarSize={36}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={!entry.hasData ? '#e5e7eb' : entry.goalReached ? '#22c55e' : '#60a5fa'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Chart legend */}
          <div className="flex gap-4 justify-center mt-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-green-400" /> {t('history.goalReached')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-blue-400" /> {t('history.goalMissed')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-gray-200" /> {t('history.noData')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
