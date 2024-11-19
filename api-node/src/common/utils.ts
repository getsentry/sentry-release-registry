export function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['true', '1', 'yes'].includes(value.toLowerCase());
}
