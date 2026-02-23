// Water Tracker — Type Definitions

export type ThemePreference = 'system' | 'light' | 'dark';

export interface UserSettings {
  id: string;
  dailyGoalMl: number;
  language: 'de' | 'en' | 'fr' | 'tr' | 'it';
  theme: ThemePreference;
  onboardingCompleted: boolean;
  favoriteBeverageIds: string[];
  lastAmounts: Record<string, number>;      // UX-04: last used amount per beverage
  favoriteAmounts: Record<string, number>;  // UX-05: quick-add amount per favorite
  createdAt: string;
  updatedAt: string;
}

export type WarningLevel = 'none' | 'mild' | 'strong';
export type BeverageCategory = 'water' | 'hot' | 'cold' | 'alcohol' | 'other';

export interface BeverageType {
  id: string;
  nameKey: string;
  icon: string;
  iconUrl?: string;
  hydrationFactor: number;
  warningLevel: WarningLevel;
  warningTextKey: string | null;
  category: BeverageCategory;
  isCustom: boolean;
  sortOrder: number;
}

export interface DrinkEntry {
  id: string;
  beverageTypeId: string;
  amountMl: number;
  hydrationFactor: number;
  waterEquivalentMl: number;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD (PK)
  totalMl: number;
  totalWaterEquivalentMl: number;
  goalMl: number;
  goalReached: boolean;
  entryCount: number;
}
