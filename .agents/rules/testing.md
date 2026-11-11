# Automated Testing & Verification Mandate

## 1. Test-Pyramide & Mindestanforderungen
- **Unit Tests (Vitest):**
  - Pflicht für 100 % aller mathematischen Formeln, Konverter, Währungsmethoden und Savegame-Parser.
  - Ausführungszeit pro Unit-Test: $\le 10\text{ms}$.
- **Integration Tests (Vitest):**
  - Zusammenspiel von State-Store, Event-Bus und Subsystemen.
- **End-to-End Tests (Playwright / Puppeteer):**
  - Vollständiger Durchlauf des Onboardings, Offline-Return-Modals und Prestige-Resets auf Desktop- und Mobile-Viewports.

## 2. Test-Disziplin (Zero Flakiness)
- Keine künstlichen Wartezeiten (`sleep(1000)` ist verboten).
- Deterministische Tests durch `vi.useFakeTimers()` und ge-seedete Pseudozufalls-Generatoren.
- **Defect Reproduction First:** Jeder Bugfix erfordert einen vorab geschriebenen Test, der den Defekt nachstellt und vor dem Fix rot ist.

## 3. Definition of Done für Pull Requests
Ein PR gilt als testseitig abgeschlossen, wenn:
1. `npm run check` fehlerfrei durchläuft.
2. `npm run test` (Unit + Integration) mit 100 % Erfolgsquote besteht.
3. Keine Regressionen in bestehenden Testsuiten auftreten.
4. Alle neuen öffentlichen Schnittstellen mindestens einen positiven und zwei negative Testfälle besitzen.

