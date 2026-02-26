import Dexie, { type EntityTable } from 'dexie';
import type { UserSettings, DrinkEntry, DailySummary, CustomBeverage } from '../types';

const db = new Dexie('WaterTrackerDB') as Dexie & {
  settings: EntityTable<UserSettings, 'id'>;
  drinkEntries: EntityTable<DrinkEntry, 'id'>;
  dailySummaries: EntityTable<DailySummary, 'date'>;
  customBeverages: EntityTable<CustomBeverage, 'id'>;
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

// v4: Add lastAmounts + favoriteAmounts (UX-04, UX-05)
db.version(4).stores({
  settings: 'id',
  drinkEntries: 'id, beverageTypeId, date, timestamp',
  dailySummaries: 'date',
}).upgrade(async tx => {
  await tx.table('settings').toCollection().modify(s => {
    if (!s.lastAmounts) s.lastAmounts = {};
    if (!s.favoriteAmounts) s.favoriteAmounts = {};
  });
});

// v5: Add customBeverages store (US-007)
db.version(5).stores({
  settings: 'id',
  drinkEntries: 'id, beverageTypeId, date, timestamp',
  dailySummaries: 'date',
  customBeverages: 'id, sortOrder',
});

// v6: Add personalized goal fields (US-010)
db.version(6).stores({
  settings: 'id',
  drinkEntries: 'id, beverageTypeId, date, timestamp',
  dailySummaries: 'date',
  customBeverages: 'id, sortOrder',
}).upgrade(async tx => {
  await tx.table('settings').toCollection().modify(s => {
    if (!s.goalMode) s.goalMode = 'manual';
  });
});

// v7: Add customTimestamp to drinkEntries (Ansatz A retroactive entries)
db.version(7).stores({
  settings: 'id',
  drinkEntries: 'id, beverageTypeId, date, timestamp',
  dailySummaries: 'date',
  customBeverages: 'id, sortOrder',
});

export { db };
