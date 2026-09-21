export function isValidEmail(email: string): boolean {
  const value = (email ?? "").trim();
  if (!value || value.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}