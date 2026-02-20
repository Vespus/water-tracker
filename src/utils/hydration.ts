/** Calculate water equivalent from amount and hydration factor */
export function calcWaterEquivalent(amountMl: number, hydrationFactor: number): number {
  return Math.round(amountMl * hydrationFactor);
}
