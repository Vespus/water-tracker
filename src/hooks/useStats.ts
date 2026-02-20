import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useSettings } from './useSettings';
import type { DrinkEntry } from '../types';

/** Get YYYY-MM-DD for a Date (local time) */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Get Monday of the week containing `d` */
function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Generate array of date strings for 7 days starting from `start` */
function weekDates(start: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return toDateStr(d);
  });
}

export interface DaySummary {
  date: string;
  totalMl: number;
  totalWaterEquivalentMl: number;
  goalMl: number;
  goalReached: boolean;
  entryCount: number;
  entries: DrinkEntry[];
  hasData: boolean;
}

function buildDaySummaries(
  entries: DrinkEntry[],
  dates: string[],
  goalMl: number,
): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();
  // Init all dates
  for (const date of dates) {
    map.set(date, {
      date,
      totalMl: 0,
      totalWaterEquivalentMl: 0,
      goalMl,
      goalReached: false,
      entryCount: 0,
      entries: [],
      hasData: false,
    });
  }
  for (const e of entries) {
    let s = map.get(e.date);
    if (!s) {
      s = { date: e.date, totalMl: 0, totalWaterEquivalentMl: 0, goalMl, goalReached: false, entryCount: 0, entries: [], hasData: false };
      map.set(e.date, s);
    }
    s.totalMl += e.amountMl;
    s.totalWaterEquivalentMl += e.waterEquivalentMl;
    s.entryCount += 1;
    s.entries.push(e);
    s.hasData = true;
  }
  for (const s of map.values()) {
    s.goalReached = s.hasData && s.totalWaterEquivalentMl >= s.goalMl;
  }
  return map;
}

/** Last N days of history (sorted newest first) */
export function useHistory(days = 35) {
  const { settings } = useSettings();
  const goalMl = settings.dailyGoalMl;

  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }

  const summaries = useLiveQuery(async () => {
    const startDate = dates[dates.length - 1];
    const endDate = dates[0];
    const entries = await db.drinkEntries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
    const map = buildDaySummaries(entries, dates, goalMl);
    return dates.map(d => map.get(d)!);
  }, [goalMl, days]);

  return summaries ?? [];
}

/** Entries for a specific date */
export function useDayEntries(date: string) {
  const entries = useLiveQuery(
    () => db.drinkEntries.where('date').equals(date).sortBy('timestamp'),
    [date],
    [],
  );
  return entries ?? [];
}

/** Weekly stats for chart */
export function useWeekStats(weekOffset = 0) {
  const { settings } = useSettings();
  const goalMl = settings.dailyGoalMl;

  const today = new Date();
  const monday = getMonday(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const dates = weekDates(monday);

  const data = useLiveQuery(async () => {
    const entries = await db.drinkEntries
      .where('date')
      .between(dates[0], dates[6], true, true)
      .toArray();
    const map = buildDaySummaries(entries, dates, goalMl);
    return dates.map(d => map.get(d)!);
  }, [goalMl, weekOffset]);

  return { days: data ?? [], goalMl, weekStart: dates[0], weekEnd: dates[6] };
}

/** Current streak of consecutive goal-reached days (ending today or yesterday) */
export function useStreak() {
  const { settings } = useSettings();
  const goalMl = settings.dailyGoalMl;

  const streak = useLiveQuery(async () => {
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toDateStr(d);
      const entries = await db.drinkEntries.where('date').equals(dateStr).toArray();
      if (entries.length === 0) {
        // today with no entries yet doesn't break streak
        if (i === 0) continue;
        break;
      }
      const total = entries.reduce((s, e) => s + e.waterEquivalentMl, 0);
      if (total >= goalMl) {
        count++;
      } else {
        // today not reached yet doesn't break streak
        if (i === 0) continue;
        break;
      }
    }
    return count;
  }, [goalMl]);

  return streak ?? 0;
}

/** Monthly average */
export function useMonthAverage() {
  const { settings } = useSettings();

  const avg = useLiveQuery(async () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = toDateStr(firstOfMonth);
    const endDate = toDateStr(today);
    const entries = await db.drinkEntries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
    // Group by date
    const byDate = new Map<string, number>();
    for (const e of entries) {
      byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.waterEquivalentMl);
    }
    const daysWithData = byDate.size;
    if (daysWithData === 0) return 0;
    const total = [...byDate.values()].reduce((a, b) => a + b, 0);
    return Math.round(total / daysWithData);
  }, [settings.dailyGoalMl]);

  return avg ?? 0;
}

/** Compare current week vs last week total */
export function useWeekComparison() {
  const current = useWeekStats(0);
  const last = useWeekStats(-1);

  const currentTotal = current.days.reduce((s, d) => s + d.totalWaterEquivalentMl, 0);
  const lastTotal = last.days.reduce((s, d) => s + d.totalWaterEquivalentMl, 0);

  if (lastTotal === 0 && currentTotal === 0) return 'equal' as const;
  if (currentTotal > lastTotal) return 'better' as const;
  if (currentTotal < lastTotal) return 'worse' as const;
  return 'equal' as const;
}
