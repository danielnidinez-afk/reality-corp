---
name: vitest
description: "Experten-Skill für High-Speed Unit- und Integrationstests mit Vitest. Deckt ESM-native Mocks, Spies, Snapshot-Testing, Coverage-Reports und Zeit-Simulation ab."
metadata:
  version: "3.0.0"
  license: MIT
---

# Vitest Testing Best Practices

## 1. Zweck
Dieser Skill regelt die Erstellung von schnellen, deterministischen Unit- und Modultests für Business-Logik, mathematische Berechnungen und State Stores.

## 2. Kernrichtlinien

### 2.1 Test-Struktur (AAA Pattern)
Jeder Test folgt dem Arrange-Act-Assert Muster:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateIdleEarnings } from './economy';

describe('calculateIdleEarnings', () => {
  it('berechnet Offline-Gewinne mit exponentiellem Zins korrekt', () => {
    // Arrange
    const baseRate = 100;
    const elapsedSeconds = 3600;
    const efficiency = 0.8;

    // Act
    const earnings = calculateIdleEarnings(baseRate, elapsedSeconds, efficiency);

    // Assert
    expect(earnings).toBe(288_000);
  });
});
```

### 2.2 Zeit- & Datums-Simulation
Bei allen Tests, die auf `Date.now()`, `performance.now()` oder `setTimeout` basieren:
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

### 2.3 Sauberes Mocking
- Mocke nur externe Systemgrenzen (z.B. API-Aufrufe, Browser-Speicher), niemals die zu testende Business-Logik selbst.
- Verwende `vi.mock()` auf Modulebene und `vi.fn()` für Callback-Spies.

