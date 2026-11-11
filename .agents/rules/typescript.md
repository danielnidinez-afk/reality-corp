# TypeScript Strict Standards & Type Safety

## 1. Compiler-Konfiguration & Strenge
- Das gesamte Projekt nutzt TypeScript im striktesten Modus (`strict: true`).
- Pflicht-Compiler-Optionen:
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `exactOptionalPropertyTypes: true`
  - `noUncheckedIndexedAccess: true`
  - `noImplicitOverride: true`

## 2. Verbot von `any` und ungesicherten Casts
- Die Verwendung von `any` ist im Produktiv- und Testcode untersagt.
- Externe oder unsichere Daten werden als `unknown` typisiert und mit Type-Guards oder Zod-Validierungsschemas geprüft.
- Typ-Casts (`as TargetType`) sind auf das absolute Minimum zu beschränken und dürfen nicht zur Umgehung von Type-Errors verwendet werden.

## 3. Branded Types für Währungen & Zeiteinheiten
Zur Vermeidung von Rechenfehlern zwischen unterschiedlichen Einheiten sind Branded Types Pflicht:
```typescript
declare const __brand: unique symbol;
export type Brand<T, B> = T & { readonly [__brand]: B };

export type RealityCash = Brand<Decimal, 'RealityCash'>;
export type ComputeFlops = Brand<Decimal, 'ComputeFlops'>;
export type GameTick = Brand<number, 'GameTick'>;
export type TimestampMs = Brand<number, 'TimestampMs'>;
```
Niemals Cash und Flops in nackten Zahlen ohne Konvertierungsfunktion vermischen!

## 4. Unveränderlichkeit (Immutability)
- Funktionsparameter, die nicht mutiert werden dürfen, sind als `readonly` zu deklarieren (z.B. `readonly state: GameState`).
- Konstanten und Konfigurationsobjekte müssen mit `as const` deklariert werden.

