export function currencyFractionDigits(currency: string): number {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
  }).resolvedOptions().maximumFractionDigits ?? 2;
}

export function parseAmountToMinorUnits(
  amount: string,
  currency: string,
): number | null {
  const digits = currencyFractionDigits(currency);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!match || (match[2]?.length ?? 0) > digits) return null;

  const fraction = (match[2] ?? '').padEnd(digits, '0');
  const minorUnits = `${match[1]}${fraction}`.replace(/^0+(?=\d)/, '');
  const maximum = '100000000000';
  if (
    minorUnits === '0' ||
    minorUnits.length > maximum.length ||
    (minorUnits.length === maximum.length && minorUnits > maximum)
  ) {
    return null;
  }
  return Number(minorUnits);
}

export function minorUnitsToInput(amountMinor: number, currency: string): string {
  const digits = currencyFractionDigits(currency);
  const value = String(amountMinor).padStart(digits + 1, '0');
  if (!digits) return value;
  const whole = value.slice(0, -digits);
  const fraction = value.slice(-digits);
  return `${whole}.${fraction}`;
}

export function formatMinorUnits(
  amountMinor: number,
  currency: string,
  locale?: string,
): string {
  const digits = currencyFractionDigits(currency);
  const amount = amountMinor / 10 ** digits;
  const resolvedLocale =
    locale === 'am' ? 'am-ET' : locale === 'en' ? 'en-US' : locale;
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}
