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
  month: number;
  summaryMap: Map<string, DaySummary>;
  onDayClick: (date: string) => void;
}) {
  const { t } = useTranslation();
  const dayLabels = [
    t('history.mon'), t('history.tue'), t('history.wed'),
    t('history.thu'), t('history.fri'), t('history.sat'), t('history.sun'),
  ];

  const firstDay = new Date(year, month, 1);
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
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {dayLabels.map(d => (
          <div key={d} className="font-semibold text-gray-400 dark:text-gray-500 py-1 text-[11px] tracking-wide">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const summary = summaryMap.get(dateStr);
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          const isFuture = dateStr > new Date().toISOString().slice(0, 10);

          const goalReached = summary?.hasData && summary.goalReached;
          const goalMissed = summary?.hasData && !summary.goalReached;

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(dateStr)}
              disabled={isFuture}
              className={`relative aspect-square flex items-center justify-center rounded-xl text-sm transition-all duration-150 font-medium
                ${isToday ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}
                ${goalReached ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : ''}
                ${goalMissed ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : ''}
                ${!isToday && !goalReached && !goalMissed && !isFuture ? 'hover:bg-gray-100 dark:hover:bg-gray-700/60' : ''}
                ${isFuture ? 'text-gray-200 dark:text-gray-700 cursor-default' : ''}
              `}
            >
              {day}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold">{displayDate}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {entries.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8">{t('history.noData')}</p>
          ) : (
            <>
              <div className="flex gap-3 mb-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 flex-1 text-center border border-blue-100 dark:border-blue-800/30">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.totalMl')}</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">{totalMl}</div>
                  <div className="text-xs text-gray-400">ml</div>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-4 flex-1 text-center border border-cyan-100 dark:border-cyan-800/30">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('drink.waterEq')}</div>
                  <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">{Math.round(totalWeq)}</div>
                  <div className="text-xs text-gray-400">ml</div>
                </div>
              </div>

              <div className="space-y-2">
                {entries.map(e => {
                  const bev = getBeverage(e.beverageTypeId);
                  const time = new Date(e.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={e.id} className="flex items-center justify-between py-3 px-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{bev?.icon ?? '💧'}</span>
                        <div>
                          <div className="text-sm font-semibold">{bev ? t(bev.nameKey) : e.beverageTypeId}</div>
                          <div className="text-xs text-gray-400">{time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{e.amountMl} ml</div>
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
    </div>
  );
}

export default function History() {
  const { t } = useTranslation();
  const history = useHistory(90);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const summaryMap = new Map<string, DaySummary>();
  for (const s of history) summaryMap.set(s.date, s);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const daysWithGoal = history.filter(d => d.hasData && d.goalReached).length;
  const daysWithData = history.filter(d => d.hasData).length;

  return (
    <div className="page-enter pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <Droplets size={22} className="text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">{t('nav.history')}</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Summary chips */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">{daysWithGoal}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('history.goalDays')}</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 rounded-2xl px-4 py-2.5 shadow-sm">
            <span className="text-sm font-bold">{daysWithData}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('history.trackedDays')}</span>
          </div>
        </div>

        {/* Calendar card */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthOffset(o => o - 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setMonthOffset(0)}
              className="text-sm font-semibold text-blue-500 dark:text-blue-400 hover:underline disabled:text-gray-400 disabled:no-underline transition-colors"
              disabled={monthOffset === 0}
            >
              {t('history.today')}
            </button>
            <button
              onClick={() => setMonthOffset(o => o + 1)}
              disabled={monthOffset >= 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl disabled:opacity-30 transition-colors"
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
        </div>

        {/* Legend */}
        <div className="flex gap-5 justify-center text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-green-200 dark:bg-green-900/50" />
            {t('history.goalReached')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-100 dark:bg-red-900/30" />
            {t('history.goalMissed')}
          </span>
        </div>
      </div>

      {selectedDate && <DayDetail date={selectedDate} onClose={() => setSelectedDate(null)} />}
    </div>
  );
}
