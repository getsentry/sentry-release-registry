export function isTruthy(value: string): boolean {
  return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
}
