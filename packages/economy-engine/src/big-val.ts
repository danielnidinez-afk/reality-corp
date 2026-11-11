import Decimal from 'break_infinity.js';
import type { BigVal as BigValContract, BigValSnapshot } from '@reality-corp/shared-types';

const COMPACT_SUFFIXES: readonly string[] = [
  '',
  'K',
  'M',
  'B',
  'T',
  'Qa',
  'Qi',
  'Sx',
  'Sp',
  'Oc',
  'No',
  'Dc'
];

export type BigValInput = number | string | BigValSnapshot | BigVal;

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be finite, received ${value}`);
  }
}

function toInternalDecimal(input: BigValInput): Decimal {
  if (input instanceof BigVal) {
    return input.raw;
  }
  if (typeof input === 'number') {
    assertFiniteNumber(input, 'BigVal numeric input');
    return Decimal.fromNumber(input);
  }
  if (typeof input === 'string') {
    const parsed = Decimal.fromString(input);
    assertFiniteNumber(parsed.mantissa, 'BigVal parsed mantissa');
    assertFiniteNumber(parsed.exponent, 'BigVal parsed exponent');
    return parsed;
  }
  assertFiniteNumber(input.m, 'BigValSnapshot.m');
  assertFiniteNumber(input.e, 'BigValSnapshot.e');
  return Decimal.fromMantissaExponent(input.m, Math.trunc(input.e));
}

/**
 * Immutable adapter over `break_infinity.js` enforcing finite-number invariants
 * and deterministic `{ m, e }` snapshot serialization (ADR DEC-04).
 */
export class BigVal implements BigValContract {
  public readonly raw: Decimal;

  private constructor(raw: Decimal) {
    assertFiniteNumber(raw.mantissa, 'BigVal mantissa');
    assertFiniteNumber(raw.exponent, 'BigVal exponent');
    this.raw = raw;
  }

  public get mantissa(): number {
    return this.raw.mantissa;
  }

  public get exponent(): number {
    return this.raw.exponent;
  }

  public static zero(): BigVal {
    return new BigVal(Decimal.fromNumber(0));
  }

  public static one(): BigVal {
    return new BigVal(Decimal.fromNumber(1));
  }

  public static from(input: BigValInput): BigVal {
    if (input instanceof BigVal) {
      return input;
    }
    return new BigVal(toInternalDecimal(input));
  }

  public static fromSnapshot(snapshot: BigValSnapshot): BigVal {
    return BigVal.from(snapshot);
  }

  public isZero(): boolean {
    return this.raw.mantissa === 0;
  }

  public isNegative(): boolean {
    return this.raw.mantissa < 0;
  }

  public add(other: BigValInput): BigVal {
    return new BigVal(this.raw.add(toInternalDecimal(other)));
  }

  /** Subtracts `other` and clamps at zero to prevent negative resource balances. */
  public subClamped(other: BigValInput): BigVal {
    const result = this.raw.sub(toInternalDecimal(other));
    if (result.mantissa <= 0) {
      return BigVal.zero();
    }
    return new BigVal(result);
  }

  public mul(other: BigValInput): BigVal {
    return new BigVal(this.raw.mul(toInternalDecimal(other)));
  }

  public div(other: BigValInput): BigVal {
    const divisor = toInternalDecimal(other);
    if (divisor.mantissa === 0) {
      throw new RangeError('Division by zero in BigVal.div');
    }
    return new BigVal(this.raw.div(divisor));
  }

  public pow(exponent: number): BigVal {
    assertFiniteNumber(exponent, 'BigVal.pow exponent');
    return new BigVal(this.raw.pow(exponent));
  }

  public sqrt(): BigVal {
    if (this.raw.mantissa < 0) {
      throw new RangeError('Cannot take sqrt of negative BigVal');
    }
    return new BigVal(this.raw.sqrt());
  }

  public floor(): BigVal {
    return new BigVal(this.raw.floor());
  }

  public ceil(): BigVal {
    return new BigVal(this.raw.ceil());
  }

  public cmp(other: BigValInput): -1 | 0 | 1 {
    const res = this.raw.cmp(toInternalDecimal(other));
    if (res < 0) return -1;
    if (res > 0) return 1;
    return 0;
  }

  public eq(other: BigValInput): boolean {
    return this.cmp(other) === 0;
  }

  public gt(other: BigValInput): boolean {
    return this.cmp(other) === 1;
  }

  public gte(other: BigValInput): boolean {
    return this.cmp(other) >= 0;
  }

  public lt(other: BigValInput): boolean {
    return this.cmp(other) === -1;
  }

  public lte(other: BigValInput): boolean {
    return this.cmp(other) <= 0;
  }

  public log10(): number {
    if (this.raw.mantissa <= 0) {
      throw new RangeError('BigVal.log10 requires strictly positive value');
    }
    return this.raw.log10();
  }

  public toSnapshot(): BigValSnapshot {
    if (this.raw.mantissa === 0) {
      return { m: 0, e: 0 };
    }
    return { m: this.raw.mantissa, e: this.raw.exponent };
  }

  public toNumber(): number {
    return this.raw.toNumber();
  }

  public toString(): string {
    return this.raw.toString();
  }

  /** Formats value with human-readable Tycoon suffixes up to Dc ($10^{33}$), then scientific notation. */
  public formatCompact(decimals = 2): string {
    if (this.isZero()) {
      return '0';
    }
    if (this.raw.exponent < 3 && this.raw.exponent >= 0) {
      const value = this.raw.toNumber();
      return Number.isInteger(value) ? value.toString() : value.toFixed(decimals);
    }
    if (this.raw.exponent < 0) {
      return this.raw.toNumber().toFixed(decimals);
    }
    const tier = Math.floor(this.raw.exponent / 3);
    const suffix = COMPACT_SUFFIXES[tier];
    if (suffix !== undefined) {
      const scaled = this.raw.mantissa * Math.pow(10, this.raw.exponent - tier * 3);
      return `${scaled.toFixed(decimals)}${suffix}`;
    }
    return `${this.raw.mantissa.toFixed(decimals)}e${this.raw.exponent}`;
  }
}
