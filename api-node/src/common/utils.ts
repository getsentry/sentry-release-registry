export function isTruthy(value: string): boolean {
  return ['true', '1', 'yes'].includes(value.toLowerCase());
}
