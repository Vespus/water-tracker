import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from 'recharts';
import { useHourlyStats } from '../../hooks/useStats';

/** YYYY-MM-DD for a date offset from today (0 = today, -1 = yesterday, …) */
function toDateStrOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HourlyDistribution() {
  const { t } = useTranslation();
  const [dayOffset, setDayOffset] = useState(0); // 0 = today
  const date = toDateStrOffset(dayOffset);

  const { slots, maxMl } = useHourlyStats(date);

  // Build Recharts-compatible data
  const chartData = slots.map(s => ({
    hour: s.hour,
    label: `${s.hour}`,
    value: s.ml,
    hasDrink: s.hasDrink,
    isGap: s.isGap,
    isFuture: s.isFuture,
  }));

  const hasAnyData = slots.some(s => s.hasDrink);
  const gapCount = slots.filter(s => s.isGap).length;

  // Day label
  const dayLabel =
    dayOffset === 0
      ? t('history.today')
      : dayOffset === -1
      ? t('hourlyStats.yesterday')
      : t('hourlyStats.dayAgo', { days: Math.abs(dayOffset) });

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const ml = payload[0].value;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg border border-gray-100 dark:border-gray-700 text-xs">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}:00</span>
        <span className="ml-2 text-gray-500 dark:text-gray-400">
          {ml > 0 ? t('hourlyStats.tooltipMl', { ml }) : t('hourlyStats.noEntry')}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('hourlyStats.title')}
          </span>
        </div>

        {/* Day navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDayOffset(o => o - 1)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setDayOffset(0)}
            disabled={dayOffset === 0}
            className="text-xs font-medium text-blue-500 dark:text-blue-400 min-w-[72px] text-center hover:underline disabled:text-gray-400 disabled:no-underline transition-colors"
          >
            {dayLabel}
          </button>
          <button
            onClick={() => setDayOffset(o => o + 1)}
            disabled={dayOffset >= 0}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Gap warning badge */}
      {gapCount > 0 && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-1.5 border border-red-100 dark:border-red-800/30 w-fit">
          <span>⚠</span>
          <span>{t('hourlyStats.gapHint', { count: gapCount })}</span>
        </div>
      )}

      {/* Chart */}
      {!hasAnyData ? (
        <div className="flex items-center justify-center h-[160px] text-sm text-gray-400 dark:text-gray-500">
          {t('hourlyStats.noData')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="15%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fontWeight: 400 }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${v}`)}
              domain={[0, maxMl * 1.15]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="value" radius={[4, 4, 2, 2]} maxBarSize={20}>
              {chartData.map((entry, i) => {
                let fill: string;
                if (entry.hasDrink) {
                  fill = '#60a5fa'; // blue-400
                } else if (entry.isFuture) {
                  fill = '#e5e7eb'; // gray-200
                } else if (entry.isGap) {
                  fill = '#f87171'; // red-400
                } else {
                  fill = '#e5e7eb'; // gray-200
                }
                return <Cell key={i} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-3 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ background: '#60a5fa' }} />
          {t('hourlyStats.legendDrink')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ background: '#f87171' }} />
          {t('hourlyStats.legendGap')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ background: '#e5e7eb' }} />
          {t('hourlyStats.legendNoData')}
        </span>
      </div>
    </div>
  );
}
