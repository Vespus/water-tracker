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

// v2: Add theme preference field (default: 'system') to existing settings
db.version(2).stores({
  settings: 'id',
  drinkEntries: 'id, beverageTypeId, date, timestamp',
  dailySummaries: 'date',
}).upgrade(async tx => {
  await tx.table('settings').toCollection().modify(s => {
    if (!s.theme) s.theme = 'system';
  });
});

// v3: Add favoriteBeverageIds field (default: []) to existing settings
db.version(3).stores({
  settings: 'id',
  drinkEntries: 'id, beverageTypeId, date, timestamp',
  dailySummaries: 'date',
}).upgrade(async tx => {
  await tx.table('settings').toCollection().modify(s => {
    if (!s.favoriteBeverageIds) s.favoriteBeverageIds = [];
  });
});

export { db };
