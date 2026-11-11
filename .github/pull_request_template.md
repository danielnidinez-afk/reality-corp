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
- [ ] `packages/economy-engine` / `packages/game-engine` / `packages/progression-system` (Core-Simulation & Ökonomie)
- [ ] `packages/game-config` / `packages/shared-types` (Balance-Daten, Branded Types, Zod-Schemas)
- [ ] `packages/reality-sync` / `packages/ui-components` (IndexedDB Sync & UI-Primitiven)
- [ ] `apps/game-client` / `apps/admin-dashboard` (SvelteKit UI, PixiJS Canvas, Capacitor)
- [ ] `apps/backend` / `supabase/` (Fastify API, PostgreSQL Migrationen, RLS & RPCs)
- [ ] Dokumentation & Tooling

## 🧪 Nachweis der Tests
<!-- Wie wurden die Änderungen verifiziert? Unit-Tests, Benchmarks, E2E-Screenshots -->
- [ ] Unit-Tests hinzugefügt und lokal bestanden (`pnpm test`)
- [ ] TypeScript Check ohne Fehler (`pnpm check`)
- [ ] Linter ohne Fehler (`pnpm lint`)
- [ ] Kein Performance-Rückgang im Frame-Budget (60 FPS stabil)

## 🛡️ Sicherheits- & Architekturprüfung
- [ ] Keine sensiblen Schlüssel oder Passwörter enthalten
- [ ] Keine unbegründeten neuen Third-Party-Abhängigkeiten
- [ ] Schichtenentkopplung gewahrt (Simulation enthält keine UI-Abhängigkeiten)
- [ ] Dateigrößen $\le 300$ Zeilen eingehalten

---
*Unterzeichnet durch:* <!-- Name des Agenten / Entwicklers -->

