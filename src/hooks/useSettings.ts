import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { UserSettings } from '../types';
import { useCallback } from 'react';

const DEFAULT_SETTINGS: UserSettings = {
  id: 'default',
  dailyGoalMl: 2000,
  language: 'de',
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function useSettings() {
  const settings = useLiveQuery(async () => {
    const s = await db.settings.get('default');
    if (!s) {
      await db.settings.put(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return s;
  });

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    await db.settings.update('default', { ...patch, updatedAt: new Date().toISOString() });
  }, []);

  return { settings: settings ?? DEFAULT_SETTINGS, updateSettings };
}
