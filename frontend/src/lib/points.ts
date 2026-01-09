/**
 * Calculate points for a prediction based on accuracy
 * Points system:
 * - Exact match: 5 points
 * - Off by 0.25: 4 points
 * - Off by 0.5: 3 points
 * - Off by 0.75: 2 points
 * - Off by 1.0: 1 point
 * - Off by more than 1.0: 0 points
 */
export function calculatePoints(prediction: number, actualGrade: number): number {
  const difference = Math.abs(prediction - actualGrade);
  
  if (difference === 0) return 5;
  if (difference <= 0.25) return 4;
  if (difference <= 0.5) return 3;
  if (difference <= 0.75) return 2;
  if (difference <= 1.0) return 1;
  return 0;
}

/**
 * Get all valid grade options (1 to 6 in 0.25 increments)
 */
export function getGradeOptions(): number[] {
  const options: number[] = [];
  for (let i = 1; i <= 6; i += 0.25) {
    options.push(Math.round(i * 100) / 100);
  }
  return options;
}

/**
 * Format grade for display
 */
export function formatGrade(grade: number): string {
  return grade.toFixed(2).replace(/\.00$/, '').replace(/\.(\d)0$/, '.$1');
}


