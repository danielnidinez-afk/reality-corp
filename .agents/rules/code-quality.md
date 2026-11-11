# Code Quality & Clean Code Standards

## 1. Minimal Change Principle
- Jeder Diff muss auf die exakte Aufgabenstellung fokussiert sein.
- Keine ungefragten Formatierungsorgien in unbeteiligten Dateien.
- Bestehende Kommentare und Lizenzen beibehalten.

## 2. Dateigrößen & Komplexitätsgrenzen
- Maximale Dateilänge: **300 Zeilen**. Größere Dateien müssen in logische Submodule zerlegt werden.
- Maximale Funktionslänge: **40 Zeilen**.
- Zyklomatische Komplexität: $\le 10$ pro Funktion.

## 3. Benennung & Lesbarkeit
- Keine kryptischen Abkürzungen (`usr_cnt` $\rightarrow$ `userCount`, `calc_fn` $\rightarrow$ `calculateIdleYield`).
- Boolesche Variablen mit Präfix: `isLoaded`, `hasActiveSubscription`, `canAffordUpgrade`.
- Konstanten in SCREAMING_SNAKE_CASE in dedizierten Konfigurationsdateien.

