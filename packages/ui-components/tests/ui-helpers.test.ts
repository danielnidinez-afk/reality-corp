import { describe, expect, it } from 'vitest';
import {
  clampPercentage,
  formatCompactNumber,
  formatCurrency,
  formatDurationCompact
} from '../src/formatters.js';

describe('packages/ui-components formatters', () => {
  it('formats compact scalars, currencies, durations, and clamped percentages', () => {
    expect(formatCompactNumber(1500)).toBe('1.50K');
    expect(formatCurrency(2_500_000, 1)).toBe('$2.5M');
    expect(formatDurationCompact(0)).toBe('00:00');
    expect(formatDurationCompact(90)).toBe('01:30');
    expect(formatDurationCompact(3_660)).toBe('1h 1m');
    expect(clampPercentage(-0.4)).toBe(0);
    expect(clampPercentage(0.625)).toBe(62.5);
    expect(clampPercentage(1.8)).toBe(100);
    expect(clampPercentage(Number.NaN)).toBe(0);
  });
});

