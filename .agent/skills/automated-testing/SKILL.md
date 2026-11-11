---
name: automated-testing
description: "Spezialisierter Skill für Test-Pyramide, Vitest-Unit-Tests, Simulations-Benchmarks, Playwright-E2E-Tests und Mocking in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Automated Testing Strategy & Verification

## 1. Zweck
Dieser Skill definiert die Test-Architektur von *REALITY CORP*. Er gewährleistet, dass die Simulationslogik, UI-Interaktionen und Backend-Integrationen kontinuierlich und vollautomatisiert gegen Regressionen geschützt sind.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Neue Tests mit Vitest oder Playwright geschrieben oder erweitert werden.
- Mock-Services für Backend-, Audio- oder LocalStorage-Schnittstellen eingerichtet werden.
- Regressionen oder Edge-Case-Fehler reproduziert und mit Regressionstests abgedeckt werden.
- CI/CD-Pipeline-Testläufe konfiguriert werden.

## 3. Arbeitsablauf
1. **Test-Pyramiden-Struktur:**
   - **Unit Tests (Vitest, 70%):** Testen reine mathematische Formeln, Währungs-Konvertierungen, Big-Number-Operationen, Zeitberechnungen und State-Transitions in $< 5$ ms pro Test.
   - **Integration Tests (Vitest + JSDOM, 20%):** Testen das Zusammenspiel von Svelte-Stores, Controller-Services und Event-Dispatchern.
   - **End-to-End Tests (Playwright / Puppeteer MCP, 10%):** Testen vollständige User Journeys: Spielstart, Klick-Aktionen, Upgrade-Kauf, Offline-Return-Modal und Savegame-Wiederherstellung.
2. **Deterministisches Mocking von Zeit & Zufall:**
   - Echte Timer und Systemuhren in Tests immer durch Fake Timers ersetzen (`vi.useFakeTimers()`).
   - Pseudo-Zufallszahlen-Generatoren (PRNG) mit festem Seed instanziieren, um stochastische Tests reproduzierbar zu machen.
3. **Headless Simulation Runner:**
   - Erstellung von schnellen Headless-Testläufen (`runSimulationTicks(10_000)`), die Jahre von simulierter In-Game-Zeit in wenigen Sekunden durchrechnen, um Deadlocks aufzudecken.

## 4. Qualitätskriterien
- **Test-Ausführungsgeschwindigkeit:** Die gesamte Unit-Test-Suite muss in $< 5$ Sekunden lokal durchlaufen.
- **Flake-Free Tests:** Null Toleranz für intermittierende (flaky) Tests; Tests mit Race Conditions werden sofort isoliert.
- **Coverage-Schwerpunkt:** 100 % Testabdeckung für die ökonomischen Kernformeln und Savegame-Serialisierung.

## 5. Typische Fehler (Anti-Patterns)
- **Schlafende Tests:** `await sleep(1000)` in Unit-Tests statt Nutzung von Fake Timers oder Event-Awaits.
- **Fragile DOM-Selektoren:** Selektieren nach tief verschachtelten CSS-Klassen (`div > div.btn-primary-small`) statt semantischer Attribute (`data-testid="buy-upgrade-btn"` oder `role="button"`).
- **Testen von Implementierungsdetails:** Testen privater Variablen statt des beobachtbaren Verhaltens.

## 6. Prüfschritte
- [ ] Werden alle Tests vor jedem Commit mit `pnpm test` ausgeführt?
- [ ] Werden Savegames über einen round-trip Test (Serialize -> Deserialize -> Assert Deep Equal) validiert?
- [ ] Werden Fehlerzustände (z.B. Netzwerk-Timeout beim Cloud-Sync) explizit getestet?

## 7. Konkrete Projektregeln für REALITY CORP
- Jeder gemeldete Bug muss durch einen minimalen fehlschlagenden Testfall (Red) nachgestellt werden, bevor der Fix implementiert wird (Green).
- Alle UI-E2E-Tests müssen auf Desktop (1920x1080) und Mobile (390x844 iPhone Viewport) stabil laufen.

