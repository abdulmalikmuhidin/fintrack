import {
  formatMinorUnits,
  parseAmountToMinorUnits,
} from './money';

describe('money helpers', () => {
  it('parses currencies with different minor-unit precision', () => {
    expect(parseAmountToMinorUnits('12.34', 'USD')).toBe(1234);
    expect(parseAmountToMinorUnits('1234', 'JPY')).toBe(1234);
    expect(parseAmountToMinorUnits('1.234', 'USD')).toBeNull();
  });

  it('formats values using their own currency and minor-unit policy', () => {
    expect(formatMinorUnits(1234, 'USD')).toBe(
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }).format(12.34),
    );
    expect(formatMinorUnits(1234, 'JPY')).toBe(
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'JPY',
      }).format(1234),
    );
  });

  it('formats currency with locale awareness without changing amounts', () => {
    const enFormatted = formatMinorUnits(50000, 'ETB', 'en');
    const amFormatted = formatMinorUnits(50000, 'ETB', 'am');

    expect(enFormatted).toBe(
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
      }).format(500),
    );
    expect(amFormatted).toBe(
      new Intl.NumberFormat('am-ET', {
        style: 'currency',
        currency: 'ETB',
      }).format(500),
    );
  });
});
