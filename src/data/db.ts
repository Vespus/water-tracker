import Dexie, { type EntityTable } from 'dexie';
import type { UserSettings, DrinkEntry, DailySummary } from '../types';

const db = new Dexie('WaterTrackerDB') as Dexie & {
  settings: EntityTable<UserSettings, 'id'>;
  drinkEntries: EntityTable<DrinkEntry, 'id'>;
  dailySummaries: EntityTable<DailySummary, 'date'>;
};

db.version(1).stores({
  settings: 'id',
  drinkEntries: 'id, beverageTypeId, date, timestamp',
  dailySummaries: 'date',
});

export { db };
