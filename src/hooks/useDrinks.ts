import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db } from '../data/db';
import { todayString } from '../utils/date';
import { calcWaterEquivalent } from '../utils/hydration';
import { defaultBeverages } from '../data/beverages';
import type { DrinkEntry, BeverageType } from '../types';

export function useTodayDrinks() {
  const today = todayString();
  const entries = useLiveQuery(() =>
    db.drinkEntries.where('date').equals(today).sortBy('timestamp'),
    [], []
  );
  return entries ?? [];
}

export function useTodaySummary() {
  const entries = useTodayDrinks();
  const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);
  const totalWaterEquivalentMl = entries.reduce((s, e) => s + e.waterEquivalentMl, 0);
  return { totalMl, totalWaterEquivalentMl, entryCount: entries.length };
}

export function useAddDrink() {
  return useCallback(async (beverageTypeId: string, amountMl: number) => {
    const bev = defaultBeverages.find(b => b.id === beverageTypeId);
    if (!bev) throw new Error(`Unknown beverage: ${beverageTypeId}`);
    const now = new Date().toISOString();
    const entry: DrinkEntry = {
      id: crypto.randomUUID(),
      beverageTypeId,
      amountMl,
      hydrationFactor: bev.hydrationFactor,
      waterEquivalentMl: calcWaterEquivalent(amountMl, bev.hydrationFactor),
      date: todayString(),
      timestamp: now,
      createdAt: now,
      updatedAt: now,
    };
    await db.drinkEntries.add(entry);
    return entry;
  }, []);
}

export function useDeleteDrink() {
  return useCallback(async (id: string) => {
    await db.drinkEntries.delete(id);
  }, []);
}

export function useUpdateDrink() {
  return useCallback(async (id: string, beverageTypeId: string, amountMl: number) => {
    const bev = defaultBeverages.find(b => b.id === beverageTypeId);
    if (!bev) throw new Error(`Unknown beverage: ${beverageTypeId}`);
    await db.drinkEntries.update(id, {
      beverageTypeId,
      amountMl,
      hydrationFactor: bev.hydrationFactor,
      waterEquivalentMl: calcWaterEquivalent(amountMl, bev.hydrationFactor),
      updatedAt: new Date().toISOString(),
    });
  }, []);
}

/**
 * Returns the last N distinct beverages used (by timestamp, deduplicated).
 * Returns empty array if no entries yet.
 */
export function useRecentBeverages(limit = 5): BeverageType[] {
  const result = useLiveQuery(async () => {
    const all = await db.drinkEntries.orderBy('timestamp').reverse().toArray();
    const seen = new Set<string>();
    const recentIds: string[] = [];
    for (const entry of all) {
      if (!seen.has(entry.beverageTypeId)) {
        seen.add(entry.beverageTypeId);
        recentIds.push(entry.beverageTypeId);
        if (recentIds.length >= limit) break;
      }
    }
    return recentIds;
  }, [], null);

  if (result === null) return []; // still loading

  return result
    .map(id => defaultBeverages.find(b => b.id === id))
    .filter((b): b is BeverageType => Boolean(b));
}

/**
 * Returns beverages for quick access:
 * - If user has set favorites → returns all favorites (in the order they were added)
 * - Fallback: top 3 most used beverages by all-time frequency
 * - Absolute fallback: water, coffee, herbal tea
 */
export function useFrequentBeverages(): BeverageType[] {
  const result = useLiveQuery(async () => {
    const settings = await db.settings.get('default');
    const favorites = settings?.favoriteBeverageIds ?? [];

    if (favorites.length > 0) {
      // Return all user-defined favorites in saved order
      return favorites;
    }

    // Fallback: top 3 by frequency
    const all = await db.drinkEntries.toArray();
    const freq: Record<string, number> = {};
    for (const e of all) {
      freq[e.beverageTypeId] = (freq[e.beverageTypeId] || 0) + 1;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return sorted.map(([id]) => id);
  }, [], null);

  if (result === null) return []; // still loading

  const ids = result.length > 0 ? result : ['water', 'coffee', 'tea_herbal'];
  return ids.map(id => defaultBeverages.find(b => b.id === id)!).filter(Boolean);
}
