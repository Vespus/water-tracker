/** Calculate water equivalent from amount and hydration factor */
export function calcWaterEquivalent(amountMl: number, hydrationFactor: number): number {
  return Math.round(amountMl * hydrationFactor);
}

// US-010: Personalized daily goal formula
export interface GoalFormulaParams {
  weightKg: number;
  activityLevel: 'low' | 'medium' | 'high';
  age: number;
  gender: 'male' | 'female';
  climate: 'cold' | 'temperate' | 'hot';
}

/**
 * Calculate personalized daily drinking goal.
 * Formula:
 *   base = weightKg × activityFactor × climateFactor
 *   if age > 60: base × 1.1
 *   if male: base + 300
 *   drinkingGoal = base × 0.8  (rest comes from food)
 */
export function calculatePersonalGoal(params: GoalFormulaParams): number {
  const activityFactors: Record<string, number> = { low: 30, medium: 35, high: 40 };
  const climateFactors: Record<string, number> = { cold: 0.9, temperate: 1.0, hot: 1.3 };

  let goalMl = params.weightKg * activityFactors[params.activityLevel] * climateFactors[params.climate];
  if (params.age > 60) goalMl *= 1.1;
  if (params.gender === 'male') goalMl += 300;
  return Math.round(goalMl * 0.8);
}

/** Returns true if all required formula params are provided and valid */
export function isFormulaComplete(params: Partial<GoalFormulaParams>): params is GoalFormulaParams {
  return (
    typeof params.weightKg === 'number' && params.weightKg > 0 &&
    typeof params.age === 'number' && params.age > 0 &&
    !!params.activityLevel &&
    !!params.gender &&
    !!params.climate
  );
}
