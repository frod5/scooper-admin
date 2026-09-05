export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(input: string): string {
  const digits = normalizePhone(input);
  if (digits.length <= 3) return digits;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function phoneToEmail(input: string): string {
  return `${normalizePhone(input)}@internal.local`;
}

export function isValidPhone(input: string): boolean {
  const digits = normalizePhone(input);
  return digits.length === 10 || digits.length === 11;
}
