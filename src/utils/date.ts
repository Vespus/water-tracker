/** Get today's date as YYYY-MM-DD */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
