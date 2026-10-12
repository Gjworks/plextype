export function withoutCredentials<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutCredentials) as T;
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "password" && key !== "refreshToken")
    .map(([key, item]) => [key, withoutCredentials(item)])) as T;
}
