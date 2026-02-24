import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db } from '../data/db';
import { defaultBeverages } from '../data/beverages';
import type { CustomBeverage, BeverageType } from '../types';

/** Convert a stored CustomBeverage to the shared BeverageType interface */
export function customToBeverageType(c: CustomBeverage): BeverageType {
  return {
    id: c.id,
    nameKey: '',          // not used for custom beverages
    customName: c.name,
    icon: '🥤',
    iconUrl: c.iconUrl,
    hydrationFactor: c.hydrationFactor,
    warningLevel: 'none',
    warningTextKey: null,
    category: 'other',
    isCustom: true,
    sortOrder: c.sortOrder,
  };
}

/** All custom beverages as BeverageType[], ordered by sortOrder */
export function useCustomBeverages(): BeverageType[] {
  const customs = useLiveQuery(
    () => db.customBeverages.orderBy('sortOrder').toArray(),
    [],
    []
  );
  return (customs ?? []).map(customToBeverageType);
}

/** Raw CustomBeverage records (for edit form pre-fill) */
export function useRawCustomBeverages(): CustomBeverage[] {
  return useLiveQuery(
    () => db.customBeverages.orderBy('sortOrder').toArray(),
    [],
    []
  ) ?? [];
}

/** Count of custom beverages */
export function useCustomBeverageCount(): number {
  return useLiveQuery(() => db.customBeverages.count(), [], 0) ?? 0;
}

/** All beverages: custom (sorted first) + default */
export function useAllBeverages(): BeverageType[] {
  const customs = useLiveQuery(
    () => db.customBeverages.orderBy('sortOrder').toArray(),
    [],
    []
  );
  return [
    ...(customs ?? []).map(customToBeverageType),
    ...defaultBeverages,
  ];
}

export const MAX_CUSTOM_BEVERAGES = 20;

/** Add a new custom beverage. Throws 'MAX_CUSTOM_BEVERAGES' if limit reached. */
export function useAddCustomBeverage() {
  return useCallback(async (name: string, iconUrl: string, hydrationFactor: number): Promise<string> => {
    const count = await db.customBeverages.count();
    if (count >= MAX_CUSTOM_BEVERAGES) throw new Error('MAX_CUSTOM_BEVERAGES');
    const id = `custom_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const sortOrder = Date.now();
    await db.customBeverages.add({ id, name, iconUrl, hydrationFactor, sortOrder, createdAt: now, updatedAt: now });
    return id;
  }, []);
}

/** Update an existing custom beverage */
export function useUpdateCustomBeverage() {
  return useCallback(async (id: string, name: string, iconUrl: string, hydrationFactor: number): Promise<void> => {
    await db.customBeverages.update(id, {
      name, iconUrl, hydrationFactor,
      updatedAt: new Date().toISOString(),
    });
  }, []);
}

/** Delete a custom beverage. DrinkEntries are intentionally kept (AC-10). */
export function useDeleteCustomBeverage() {
  return useCallback(async (id: string): Promise<void> => {
    await db.customBeverages.delete(id);
  }, []);
}
