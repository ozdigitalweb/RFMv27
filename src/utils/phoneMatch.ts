/**
 * Pure utilities for normalizing and matching Brazilian/international cell phone numbers
 * across host authentication, on-air routing, and uniqueness checks.
 */

export const DEFAULT_STATION_PHONE = '5548991984678';

export function normalizePhoneDigits(phone?: string | null): string {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * Generates canonical digit variants so inputs like:
 * - "48991984678"
 * - "5548991984678"
 * - "(48) 99198-4678"
 * - "+55 (48) 9198-4678"
 * all match reliably.
 */
export function getPhoneMatchVariants(phone?: string | null): string[] {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return [];

  const variants = new Set<string>([digits]);

  const addBrazilianVariants = (national: string) => {
    if (!national) return;
    variants.add(national);
    variants.add(`55${national}`);

    // Handle 10-digit vs 11-digit mobile numbers (DDD + 9 + 8 digits)
    if (national.length === 11 && national[2] === '9') {
      const withoutNine = `${national.slice(0, 2)}${national.slice(3)}`;
      variants.add(withoutNine);
      variants.add(`55${withoutNine}`);
    } else if (national.length === 10) {
      const withNine = `${national.slice(0, 2)}9${national.slice(2)}`;
      variants.add(withNine);
      variants.add(`55${withNine}`);
    }
  };

  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    addBrazilianVariants(digits.slice(2));
  } else if (digits.length >= 10 && digits.length <= 11) {
    addBrazilianVariants(digits);
  }

  return Array.from(variants);
}

/**
 * Canonical storage/uniqueness key for a phone number.
 * For Brazilian 10/11-digit numbers, normalizes to 55 + DDD + 9-digit mobile when possible.
 */
export function getCanonicalPhoneKey(phone?: string | null): string {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return '';

  let national = digits;
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    national = digits.slice(2);
  }

  if (national.length === 10) {
    national = `${national.slice(0, 2)}9${national.slice(2)}`;
  }

  if (national.length === 11) {
    return `55${national}`;
  }

  return digits;
}

export function phonesMatch(a?: string | null, b?: string | null): boolean {
  const variantsA = getPhoneMatchVariants(a);
  const variantsB = new Set(getPhoneMatchVariants(b));
  if (variantsA.length === 0 || variantsB.size === 0) return false;
  return variantsA.some((v) => variantsB.has(v));
}

export function isValidCellPhone(phone?: string | null): boolean {
  const digits = normalizePhoneDigits(phone);
  return digits.length >= 10 && digits.length <= 15;
}

export function formatPhoneDisplay(phone?: string | null): string {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return '';

  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return digits;
}
