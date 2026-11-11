import { BigVal, type BigValInput } from '@reality-corp/economy-engine';

/** Formats a BigVal scalar concisely for mobile-first KPI readouts. */
export function formatCompactNumber(value: BigValInput, decimals = 2): string {
  return BigVal.from(value).formatCompact(decimals);
}

/** Formats currency with a leading `$` sign. */
export function formatCurrency(value: BigValInput, decimals = 2): string {
  return `$${formatCompactNumber(value, decimals)}`;
}

/** Formats seconds into `MM:SS` or `Xh Ym` countdown strings. */
export function formatDurationCompact(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  if (safeSec >= 3600) {
    const hours = Math.floor(safeSec / 3600);
    const mins = Math.floor((safeSec % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Clamps a ratio in `[0, 1]` to a clean `[0, 100]` integer/decimal percentage. */
export function clampPercentage(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return Math.max(0, Math.min(100, ratio * 100));
}

