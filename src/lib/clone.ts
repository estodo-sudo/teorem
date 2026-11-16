/**
 * Deep copy for plain JSON data. Used instead of `structuredClone`, which is
 * not available in every React Native JS engine (Hermes).
 */
export function deepClone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}
