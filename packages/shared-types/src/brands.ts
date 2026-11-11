declare const __brand: unique symbol;

/**
 * Nominal Branded Type wrapper preventing accidental cross-currency or unit mixing.
 */
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Normalized serialized representation of a progressive big value (`m * 10^e`).
 */
export interface BigValSnapshot {
  readonly m: number;
  readonly e: number;
}

/**
 * Structural contract for immutable Big-Number values backed by `break_infinity.js` in `@reality-corp/economy-engine`.
 */
export interface BigVal {
  readonly mantissa: number;
  readonly exponent: number;
  toSnapshot(): BigValSnapshot;
  toNumber(): number;
  toString(): string;
}

export type RealityCash = Brand<BigVal, 'RealityCash'>;
export type ComputeFlops = Brand<BigVal, 'ComputeFlops'>;
export type EnergyKw = Brand<BigVal, 'EnergyKw'>;
export type DataShards = Brand<BigVal, 'DataShards'>;
export type EquityShares = Brand<BigVal, 'EquityShares'>;
export type GameTick = Brand<number, 'GameTick'>;
export type TimestampMs = Brand<number, 'TimestampMs'>;

/** Creates a validated non-negative integer {@link GameTick}. */
export function asGameTick(value: number): GameTick {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`GameTick must be a non-negative integer, received ${value}`);
  }
  return value as GameTick;
}

/** Creates a validated finite non-negative {@link TimestampMs}. */
export function asTimestampMs(value: number): TimestampMs {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`TimestampMs must be finite and non-negative, received ${value}`);
  }
  return value as TimestampMs;
}

/** Tags a {@link BigVal} instance as {@link RealityCash}. */
export function asRealityCash(val: BigVal): RealityCash {
  return val as RealityCash;
}

/** Tags a {@link BigVal} instance as {@link ComputeFlops}. */
export function asComputeFlops(val: BigVal): ComputeFlops {
  return val as ComputeFlops;
}

/** Tags a {@link BigVal} instance as {@link EnergyKw}. */
export function asEnergyKw(val: BigVal): EnergyKw {
  return val as EnergyKw;
}

/** Tags a {@link BigVal} instance as {@link DataShards}. */
export function asDataShards(val: BigVal): DataShards {
  return val as DataShards;
}

/** Tags a {@link BigVal} instance as {@link EquityShares}. */
export function asEquityShares(val: BigVal): EquityShares {
  return val as EquityShares;
}

