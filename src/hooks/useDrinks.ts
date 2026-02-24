import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db } from '../data/db';
import { todayString } from '../utils/date';
import { calcWaterEquivalent } from '../utils/hydration';
import { defaultBeverages } from '../data/beverages';
import { customToBeverageType } from './useCustomBeverages';
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

/** Resolve a beverage by ID, checking defaultBeverages first, then customBeverages in DB */
async function resolveBeverage(beverageTypeId: string): Promise<BeverageType | undefined> {
  const def = defaultBeverages.find(b => b.id === beverageTypeId);
  if (def) return def;
  const custom = await db.customBeverages.get(beverageTypeId);
  if (custom) return customToBeverageType(custom);
  return undefined;
}

export function useAddDrink() {
  return useCallback(async (beverageTypeId: string, amountMl: number) => {
    const bev = await resolveBeverage(beverageTypeId);
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
    const bev = await resolveBeverage(beverageTypeId);
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
 * Includes custom beverages; silently skips deleted ones.
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
        if (recentIds.length >= limit * 3) break; // over-fetch to account for deletions
      }
    }

    const resolved: BeverageType[] = [];
    for (const id of recentIds) {
      const def = defaultBeverages.find(b => b.id === id);
      if (def) {
        resolved.push(def);
      } else {
        const custom = await db.customBeverages.get(id);
        if (custom) resolved.push(customToBeverageType(custom));
        // Skip if deleted
      }
      if (resolved.length >= limit) break;
    }
    return resolved;
  }, [], null);

  return result ?? [];
}

/** Water is always a pinned favorite — cannot be removed */
export const PINNED_FAVORITE_ID = 'water';

/**
 * Returns beverages for quick access:
 * - "water" is ALWAYS the first entry (pinned, cannot be removed)
 * - If user has set additional favorites → appended after water (includes custom)
 * - Fallback for additional slots: top 2 most used (excluding water)
 * - Absolute fallback: water, coffee, herbal tea
 */
export function useFrequentBeverages(): BeverageType[] {
  const result = useLiveQuery(async () => {
    const settings = await db.settings.get('default');
    const rawFavorites = settings?.favoriteBeverageIds ?? [];

    // Always ensure water is first; deduplicate
    const favorites = [
      PINNED_FAVORITE_ID,
      ...rawFavorites.filter(id => id !== PINNED_FAVORITE_ID),
    ];

    if (favorites.length > 1) {
      // User has set additional favorites beyond water — resolve all
      const resolved: BeverageType[] = [];
      for (const id of favorites) {
        const def = defaultBeverages.find(b => b.id === id);
        if (def) {
          resolved.push(def);
        } else {
          const custom = await db.customBeverages.get(id);
          if (custom) resolved.push(customToBeverageType(custom));
          // Skip if deleted custom beverage
        }
      }
      return resolved;
    }

    // No extra favorites set — use water + top 2 by frequency
    const all = await db.drinkEntries.toArray();
    const freq: Record<string, number> = {};
    for (const e of all) {
      freq[e.beverageTypeId] = (freq[e.beverageTypeId] || 0) + 1;
    }
    const sorted = Object.entries(freq)
      .filter(([id]) => id !== PINNED_FAVORITE_ID)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    if (sorted.length > 0) {
      const extraIds = sorted.map(([id]) => id);
      const extra: BeverageType[] = [];
      for (const id of extraIds) {
        const def = defaultBeverages.find(b => b.id === id);
        if (def) {
          extra.push(def);
        } else {
          const custom = await db.customBeverages.get(id);
          if (custom) extra.push(customToBeverageType(custom));
        }
      }
      const water = defaultBeverages.find(b => b.id === PINNED_FAVORITE_ID)!;
      return [water, ...extra];
    }

    // Absolute fallback
    return [PINNED_FAVORITE_ID, 'coffee', 'tea_herbal']
      .map(id => defaultBeverages.find(b => b.id === id)!)
      .filter(Boolean);
  }, [], null);

  if (result === null) return []; // still loading
  return result as BeverageType[];
}
