## 📋 Beschreibung des Pull Requests
<!-- Kurze Zusammenfassung der Änderungen und der gelösten Problemstellung -->

## 🎯 Art der Änderung
- [ ] 🚀 Neues Feature (`feat`)
- [ ] 🐛 Bugfix (`fix`)
- [ ] ⚡ Performance-Optimierung (`perf`)
- [ ] ♻️ Refactoring (`refactor`)
- [ ] 🧪 Tests hinzugefügt/aktualisiert (`test`)
- [ ] 📝 Dokumentation (`docs`)
- [ ] 🔧 Konfiguration / CI (`chore`)

## 🔍 Betroffene Komponenten
- [ ] `packages/simulation-core` (Tycoon-Logik, Ökonomie, Ticker)
- [ ] `packages/client-ui` (SvelteKit UI, Pages, Modals)
- [ ] `packages/client-ui/graphics` (PixiJS Canvas, Rendering)
- [ ] `packages/backend` / Supabase (Datenbank, RLS, Edge Functions)
- [ ] `packages/shared-types` (Gemeinsame Typen & Interfaces)
- [ ] Dokumentation & Tooling

## 🧪 Nachweis der Tests
<!-- Wie wurden die Änderungen verifiziert? Unit-Tests, Benchmarks, E2E-Screenshots -->
- [ ] Unit-Tests hinzugefügt und lokal bestanden (`npm run test`)
- [ ] TypeScript Check ohne Fehler (`npm run check`)
- [ ] Linter ohne Fehler (`npm run lint`)
- [ ] Kein Performance-Rückgang im Frame-Budget (60 FPS stabil)

## 🛡️ Sicherheits- & Architekturprüfung
- [ ] Keine sensiblen Schlüssel oder Passwörter enthalten
- [ ] Keine unbegründeten neuen Third-Party-Abhängigkeiten
- [ ] Schichtenentkopplung gewahrt (Simulation enthält keine UI-Abhängigkeiten)
- [ ] Dateigrößen $\le 300$ Zeilen eingehalten

---
*Unterzeichnet durch:* <!-- Name des Agenten / Entwicklers -->

