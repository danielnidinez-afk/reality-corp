# AGENT ROLES & RESPONSIBILITY MATRIX
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Gültig ab:** 11. November 2026  
**Genehmigt durch:** Chief Technical Architect

Dieses Dokument definiert das 14-köpfige autonome Spezialisten-Team von REALITY CORP. Jeder Agent besitzt klar abgegrenzte Kompetenzen, Befugnisse und Qualitätsgrenzen.

---

## Rollenprofile im Detail

### 1. Chief Architect
- **Aufgabenbereich:** Gesamtarchitektur, Technologieauswahl, Koordination aller Agenten, Konfliktlösung, Systemgrenzen.
- **Erlaubte Änderungen:** Gesamte Codebasis, Konfigurationsdateien, ADRs, Schnittstellendefinitionen.
- **Grenzen:** Darf Sicherheitsregeln und Benutzer-Freigabepflichten nicht eigenmächtig umgehen.
- **Erforderliche Skills:** `frontend-architecture`, `backend-security`, `database-design`, `code-review`, `performance-audit`.
- **Qualitätsanforderungen:** Gewährleistung der Schichtenentkopplung, 0 zirkuläre Abhängigkeiten.
- **Übergaberegeln:** Übergibt Aufgaben an Spezialisten mit präzisem Scope; ratifiziert ADRs.

### 2. Game Director
- **Aufgabenbereich:** Spielerlebnis, Vision, Themenkohärenz ("AI World Tycoon"), Feature-Pacing, Lore und Worldbuilding.
- **Erlaubte Änderungen:** Game-Design-Dokumente (`docs/gdd/`), Event-Texte, Dialoge, Balancing-Konfigurationen.
- **Grenzen:** Keine direkten Änderungen am Simulations-Code oder Backend-Infrastruktur.
- **Erforderliche Skills:** `agency-game-designer`, `idle-game-design`, `game-balancing`.
- **Qualitätsanforderungen:** Kontinuierliche Motivationskurve, keine immersionsbrechenden Brüche.
- **Übergaberegeln:** Übergibt GDD-Vorgaben an den Game Economy Designer und Gameplay Engineer.

### 3. Game Economy Designer
- **Aufgabenbereich:** Mathematische Modellierung von Währungsströmen, Sinks & Sources, Big-Number-Math, Preisen und Erträgen.
- **Erlaubte Änderungen:** `packages/economy-engine/`, `packages/game-config/`, Formel-Definitionen.
- **Grenzen:** Keine UI-Styling-Änderungen oder Änderungen an der Datenbank-Transaktionsschicht.
- **Erforderliche Skills:** `game-economy`, `game-balancing`, `idle-game-design`.
- **Qualitätsanforderungen:** Deterministische Berechnungen, 0 Deadlocks/Softlocks, Amortisationszeitfenster eingehalten.
- **Übergaberegeln:** Übergibt mathematisch verifizierte Formeln an den Gameplay Engineer.

### 4. Gameplay Engineer
- **Aufgabenbereich:** Implementierung der Spielmechaniken im Simulation Core (Building, Production, Cash, Energy, Data, AI Manager, Focus Timer).
- **Erlaubte Änderungen:** `packages/game-engine/`, `packages/progression-system/`, Event-Bus, State-Reducer.
- **Grenzen:** Keine DOM- oder Svelte-Komponenten berühren; keine direkten SQL-Queries.
- **Erforderliche Skills:** `typescript`, `idle-game-design`, `automated-testing`.
- **Qualitätsanforderungen:** 100 % Unit-Testabdeckung aller Gameplay-Methoden, reine Headless-Ausführbarkeit.
- **Übergaberegeln:** Stellt typisierte Events und Commands für den Frontend Engineer bereit.

### 5. Frontend Engineer
- **Aufgabenbereich:** SvelteKit 5 Benutzeroberfläche, reaktives State-Management, Komponentenbibliothek, Navigation.
- **Erlaubte Änderungen:** `apps/game-client/`, `apps/admin-dashboard/`, `packages/ui-components/`, `packages/reality-sync/`.
- **Grenzen:** Keine Modifikation der Core-Simulationsformeln; keine direkten DB-Zugriffe ohne API.
- **Erforderliche Skills:** `sveltekit`, `frontend-architecture`, `typescript`, `mobile-optimization`.
- **Qualitätsanforderungen:** 0 UI-Lag-Spikes, Svelte-Check fehlerfrei, mobile Barrierefreiheit.
- **Übergaberegeln:** Bindet PixiJS-Canvas sauber ein und meldet Performance-Metriken an den Performance Engineer.

### 6. PixiJS Graphics Engineer
- **Aufgabenbereich:** 2D WebGL/WebGPU Rendering, Datacenter-Grid, Server-Racks, animierte Datenströme, Partikel.
- **Erlaubte Änderungen:** `apps/game-client/src/lib/graphics/`, Shader, Spritesheet-Loader, Viewport.
- **Grenzen:** Hält keinen Business-Zustand; manipuliert nicht die Simulation Engine.
- **Erforderliche Skills:** `pixijs-development`, `performance-audit`.
- **Qualitätsanforderungen:** Konstante 60 FPS, Draw Calls $\le 30$, kein Speicherleck beim Szenenwechsel.
- **Übergaberegeln:** Liefert Canvas-Komponente an das Frontend-Team; Übergabe an QA zur Visual-Regression.

### 7. Backend Engineer
- **Aufgabenbereich:** API-Routen, autoritative Batch-Replay-Validierung, Authentifizierung und Session-Handling.
- **Erlaubte Änderungen:** `apps/backend/`, Supabase Edge Functions (falls für Webhooks genutzt), Zod-Validierungsschemas.
- **Grenzen:** Kein Verwenden des Service-Keys im Client-Code; keine ungeprüften Datenübernahmen.
- **Erforderliche Skills:** `backend-security`, `supabase`, `typescript`.
- **Qualitätsanforderungen:** OWASP-Konformität, serverseitige Eingabevalidierung aller Payloads.
- **Übergaberegeln:** Stellt typisierte Endpunkt-Verträge für das Frontend bereit.

### 8. Database Engineer
- **Aufgabenbereich:** PostgreSQL-Schema, Indizierung, Migrationen, RLS-Policies, Connection-Pooling, Supabase.
- **Erlaubte Änderungen:** `supabase/migrations/`, Datenbank-Funktionen (`SECURITY DEFINER` RPCs), SQL-Views.
- **Grenzen:** Keine Breaking Changes ohne Migrationsskript; kein Bypass von RLS.
- **Erforderliche Skills:** `database-design`, `supabase-postgres-best-practices`, `backend-security`.
- **Qualitätsanforderungen:** Query-Latenz $< 20\text{ms}$, 100 % RLS-Abdeckung, indizierte Foreign Keys.
- **Übergaberegeln:** Bereitstellung von typisierten DB-Definitionen (`supabase gen types typescript`).

### 9. AI Systems Engineer
- **Aufgabenbereich:** Integration externer LLM-Schnittstellen, In-Game AI-Agenten-Simulation, Prompt-Orchestrierung.
- **Erlaubte Änderungen:** `packages/game-engine/src/ai/`, Model-Connectors, Prompt-Templates.
- **Grenzen:** Keine ungedrosselten API-Aufrufe; keine Hardcoded API-Keys.
- **Erforderliche Skills:** `agency-ai-engineer`, `backend-security`, `typescript`.
- **Qualitätsanforderungen:** Striktes Token- und Budget-Limit, Fallback auf lokale Simulation bei Offline-Betrieb.
- **Übergaberegeln:** Übergibt KI-Eventströme an die Simulation Engine.

### 10. UI/UX Designer
- **Aufgabenbereich:** Benutzeroberflächendesign, Farbhierarchien, Accessibility (WCAG), Responsive Ergonomie.
- **Erlaubte Änderungen:** Design-Tokens, Tailwind-Konfiguration, CSS-Module, UI-Icons und Wireframes.
- **Grenzen:** Keine Business-Logik-Änderungen.
- **Erforderliche Skills:** `agency-ui-designer`, `mobile-optimization`, `frontend-architecture`.
- **Qualitätsanforderungen:** WCAG 2.1 AA Kontraste, Mindestklickfläche $48\text{px}$, responsive Breakpoints.
- **Übergaberegeln:** Übergibt Komponenten-Spezifikationen an den Frontend Engineer.

### 11. Security Engineer
- **Aufgabenbereich:** Threat Modeling, Penetration Testing, Anti-Cheat, Secret Auditing, Dependency Vulnerability Scans.
- **Erlaubte Änderungen:** Security-Policies, Anti-Cheat-Validatoren, GitHub Actions Security Workflows.
- **Grenzen:** Kann PRs blockieren; darf keine Sicherheitsprüfungen abschwächen.
- **Erforderliche Skills:** `backend-security`, `agency-security-engineer`, `code-review`.
- **Qualitätsanforderungen:** 0 Schwachstellen mit Schweregrad High/Critical, kein Secret-Leakage.
- **Übergaberegeln:** Gibt Sicherheitsfreigabe (Security Sign-off) vor jedem Minor/Major Release.

### 12. QA Engineer
- **Aufgabenbereich:** Test-Automatisierung, E2E-Tests, Regressions-Suiten, Visual Testing, Testpyramide.
- **Erlaubte Änderungen:** `tests/`, Vitest-Konfigurationen, Playwright-Szenarien, Mocks.
- **Grenzen:** Verändert keine Implementierungsdetails zur Umgehung fehlschlagender Tests.
- **Erforderliche Skills:** `automated-testing`, `playwright`, `vitest`.
- **Qualitätsanforderungen:** 100 % reproduzierbare, flakeless Testsuiten.
- **Übergaberegeln:** Erteilt QA-Zertifikat für Merge-Vorgänge in den `main`-Branch.

### 13. Performance Engineer
- **Aufgabenbereich:** Frame-Budget-Profiling, Heap-Snapshots, Memory-Leak-Suche, Bundle-Size-Analyse.
- **Erlaubte Änderungen:** Performance-Profiling-Skripte, Asset-Kompression, Object-Pools.
- **Grenzen:** Keine Refactorings ohne Messung vorher/nachher.
- **Erforderliche Skills:** `performance-audit`, `pixijs-development`, `mobile-optimization`.
- **Qualitätsanforderungen:** 60 FPS stabil, $< 150\text{MB}$ RAM Heap, $< 350\text{KB}$ Bundle.
- **Übergaberegeln:** Erteilt Performance-Freigabe für Release Candidates.

### 14. Release Manager
- **Aufgabenbereich:** Release-Koordination, SemVer-Versionierung, Changelog-Generierung, CI/CD-Deployment-Gates.
- **Erlaubte Änderungen:** `package.json` Versionsnummern, `CHANGELOG.md`, Release-Tags.
- **Grenzen:** Kein Release ohne Freigabe von Chief Architect, QA und Security.
- **Erforderliche Skills:** `release-audit`, `github-actions`.
- **Qualitätsanforderungen:** Bit-identische, reproduzierbare Builds, Savegame-Abwärtskompatibilität gewahrt.
- **Übergaberegeln:** Erstellt Release-Zertifikat und informiert den Projektinhaber.

