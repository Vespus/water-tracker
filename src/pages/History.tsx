import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X, Droplets } from 'lucide-react';
import { useHistory, useDayEntries, type DaySummary } from '../hooks/useStats';
import { defaultBeverages } from '../data/beverages';

function getBeverage(id: string) {
  return defaultBeverages.find(b => b.id === id);
}

/** Calendar grid for a single month */
function MonthCalendar({
  year, month, summaryMap, onDayClick,
}: {
  year: number;
  month: number; // 0-indexed
  summaryMap: Map<string, DaySummary>;
  onDayClick: (date: string) => void;
}) {
  const { t } = useTranslation();
  const dayLabels = [
    t('history.mon'), t('history.tue'), t('history.wed'),
    t('history.thu'), t('history.fri'), t('history.sat'), t('history.sun'),
  ];

  const firstDay = new Date(year, month, 1);
  // Monday=0, Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthNames = t('history.months', { returnObjects: true }) as string[];
  const monthLabel = `${monthNames[month]} ${year}`;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {dayLabels.map(d => (
          <div key={d} className="font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const summary = summaryMap.get(dateStr);
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          const isFuture = dateStr > new Date().toISOString().slice(0, 10);

          let dotColor = '';
          if (summary?.hasData) {
            dotColor = summary.goalReached
              ? 'bg-green-500'
              : 'bg-red-400';
          }

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(dateStr)}
              disabled={isFuture}
              className={`relative p-1 rounded-lg text-sm transition-colors
                ${isToday ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
                ${isFuture ? 'text-gray-300 dark:text-gray-600 cursor-default' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              {day}
              {dotColor && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotColor}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Detail overlay for a specific day */
function DayDetail({ date, onClose }: { date: string; onClose: () => void }) {
  const { t } = useTranslation();
  const entries = useDayEntries(date);

  const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);
  const totalWeq = entries.reduce((s, e) => s + e.waterEquivalentMl, 0);

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{displayDate}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">{t('history.noData')}</p>
        ) : (
          <>
            <div className="flex gap-4 mb-4 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 flex-1 text-center">
                <div className="text-gray-500 dark:text-gray-400">{t('dashboard.totalMl')}</div>
                <div className="text-xl font-bold">{totalMl}</div>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-3 flex-1 text-center">
                <div className="text-gray-500 dark:text-gray-400">{t('drink.waterEq')}</div>
                <div className="text-xl font-bold">{Math.round(totalWeq)}</div>
              </div>
            </div>

            <div className="space-y-2">
              {entries.map(e => {
                const bev = getBeverage(e.beverageTypeId);
                const time = new Date(e.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{bev?.icon ?? '💧'}</span>
                      <div>
                        <div className="text-sm font-medium">{bev ? t(bev.nameKey) : e.beverageTypeId}</div>
                        <div className="text-xs text-gray-400">{time}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{e.amountMl} ml</div>
                      <div className="text-xs text-gray-400">{Math.round(e.waterEquivalentMl)} ml weq</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const { t } = useTranslation();
  const history = useHistory(90);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  // Build summary map
  const summaryMap = new Map<string, DaySummary>();
  for (const s of history) summaryMap.set(s.date, s);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Stats for displayed month
  const daysWithGoal = history.filter(d => d.hasData && d.goalReached).length;
  const daysWithData = history.filter(d => d.hasData).length;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Droplets size={24} className="text-blue-500" />
        {t('nav.history')}
      </h1>

      {/* Summary bar */}
      <div className="flex gap-3 mb-4 text-sm">
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg px-3 py-2 flex items-center gap-1">
          <span className="text-green-600 dark:text-green-400 font-bold">{daysWithGoal}</span>
          <span className="text-gray-500 dark:text-gray-400">{t('history.goalDays')}</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-1">
          <span className="font-bold">{daysWithData}</span>
          <span className="text-gray-500 dark:text-gray-400">{t('history.trackedDays')}</span>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMonthOffset(o => o - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setMonthOffset(0)}
          className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          disabled={monthOffset === 0}
        >
          {t('history.today')}
        </button>
        <button
          onClick={() => setMonthOffset(o => o + 1)}
          disabled={monthOffset >= 0}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <MonthCalendar
        year={viewYear}
        month={viewMonth}
        summaryMap={summaryMap}
        onDayClick={setSelectedDate}
      />

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400 dark:text-gray-500 justify-center">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {t('history.goalReached')}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> {t('history.goalMissed')}</span>
      </div>

      {selectedDate && <DayDetail date={selectedDate} onClose={() => setSelectedDate(null)} />}
    </div>
  );
}
