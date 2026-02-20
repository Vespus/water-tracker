import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { UserSettings } from '../types';
import { useCallback, useEffect } from 'react';

const DEFAULT_SETTINGS: UserSettings = {
  id: 'default',
  dailyGoalMl: 2000,
  language: 'de',
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get('default'));

  // Seed default settings if none exist (outside liveQuery to avoid ReadOnlyError)
  useEffect(() => {
    db.settings.get('default').then(s => {
      if (!s) db.settings.put(DEFAULT_SETTINGS);
    });
  }, []);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    await db.settings.update('default', { ...patch, updatedAt: new Date().toISOString() });
  }, []);

  return { settings: settings ?? DEFAULT_SETTINGS, updateSettings };
}
