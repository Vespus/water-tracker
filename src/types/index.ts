// Water Tracker — Type Definitions

export type ThemePreference = 'system' | 'light' | 'dark';
export type ActivityLevel = 'low' | 'medium' | 'high';
export type ClimateType = 'cold' | 'temperate' | 'hot';
export type GenderType = 'male' | 'female';
export type GoalMode = 'formula' | 'manual';

export interface UserSettings {
  id: string;
  dailyGoalMl: number;
  language: 'de' | 'en' | 'fr' | 'tr' | 'it';
  theme: ThemePreference;
  onboardingCompleted: boolean;
  favoriteBeverageIds: string[];
  lastAmounts: Record<string, number>;      // UX-04: last used amount per beverage
  favoriteAmounts: Record<string, number>;  // UX-05: quick-add amount per favorite
  // US-010: Personalized daily goal
  goalMode: GoalMode;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  age?: number;
  gender?: GenderType;
  climate?: ClimateType;
  createdAt: string;
  updatedAt: string;
}

export type WarningLevel = 'none' | 'mild' | 'strong';
export type BeverageCategory = 'water' | 'hot' | 'cold' | 'alcohol' | 'other';

export interface BeverageType {
  id: string;
  nameKey: string;
  /** For custom beverages: direct display name (overrides nameKey translation) */
  customName?: string;
  icon: string;
  iconUrl?: string;
  hydrationFactor: number;
  warningLevel: WarningLevel;
  warningTextKey: string | null;
  category: BeverageCategory;
  isCustom: boolean;
  sortOrder: number;
}

/** Custom beverage stored in IndexedDB */
export interface CustomBeverage {
  id: string;
  name: string;           // user-provided, max 30 chars
  iconUrl: string;        // /icons/*.png
  hydrationFactor: number; // 0.0–1.5
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
  customTimestamp?: string; // ISO 8601 — optionale Überschreibung des display-Timestamps
}

export interface DailySummary {
  date: string; // YYYY-MM-DD (PK)
  totalMl: number;
  totalWaterEquivalentMl: number;
  goalMl: number;
  goalReached: boolean;
  entryCount: number;
}
