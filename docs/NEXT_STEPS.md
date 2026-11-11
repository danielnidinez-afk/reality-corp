# NEXT STEPS: TRANSITION PLAN IN PHASE 07 (APEX SYNDICATE MVP)
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Stand:** 11. November 2026 (Freigabe nach Phase 06 Gate)

---

## 1. Sofortige Benutzer-Freigaben & Umgebungs-Setup

Bevor der erste ausführbare Code in `develop` gemerged wird, stehen diese einmaligen Setup-Schritte an:

1. **Lokalen Audit-Stand nach GitHub pushen & Branch Protection aktivieren:**
   - Nach Abschluss von Phase 06 befinden sich die Audit-Fixes und Berichte lokal auf `develop`. Pushen nach expliziter Freigabe:
     ```bash
     git push origin develop
     ```
   - Im GitHub-Repository (`danielnidinez-afk/reality-corp`) unter **Settings → Branches** die Schutzregeln für `main` und `develop` gemäß [`docs/GITHUB_WORKFLOW.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/GITHUB_WORKFLOW.md) aktivieren (`Require pull request`, `Require status checks`, `Linear history`, `Include administrators`).
2. **`pnpm@10` global installieren (benutzerschreibbares Präfix, ohne Admin-Rechte):**
   ```bash
   npm install -g pnpm@10
   pnpm --version
   ```
3. **Docker Desktop & Supabase vorbereiten (für Backend-/DB-Tests):**
   - Docker Desktop starten, sobald Datenbank-Migrationen oder Backend-Container getestet werden (`ISSUE-02`).
   - Supabase-Projekt anlegen, URL/`anon`-Key/`service_role`-Key in lokale `.env.local` (basierend auf [`.env.example`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.env.example)) eintragen und optional das offizielle Supabase-Plugin im Antigravity-Profil verbinden.

---

## 2. Phase 07A: Monorepo Root & Toolchain Scaffolding

- [ ] Root-`package.json` anlegen (`"packageManager": "pnpm@10..."`, `"engines": { "node": ">=24" }`, Workspace-Skripte `check`, `lint`, `test`, `build`).
- [ ] `pnpm-workspace.yaml` (gemäß [`docs/PROJECT_STRUCTURE.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/PROJECT_STRUCTURE.md)) für `apps/*` und `packages/*` anlegen.
- [ ] `tsconfig.base.json` mit strengsten Flags aus [`.agents/rules/typescript.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.agents/rules/typescript.md) erstellen (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`).
- [ ] Initiale `pnpm-lock.yaml` erzeugen und CI-Grünlauf von [`.github/workflows/ci.yml`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.github/workflows/ci.yml) (`pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm audit --audit-level=high`) nachweisen.

---

## 3. Phase 07B: Deterministische Core-Pakete (`packages/`)

1. **`packages/shared-types`:** Zod `^3.24.2` Schemas (`DEC-09`), API-DTOs, Branded Types (`RealityCash`, `ComputeFlops`, `EnergyKw`, `DataShards`, `EquityShares` auf Basis `BigVal`).
2. **`packages/economy-engine`:** `BigVal`-Adapter über `break_infinity.js` (`DEC-04`/`DEC-12`), geometrische Bulk-/`BuyMax`-Kosten, Energy-Brownout-Faktor $\eta$, Prestige-Wurzelformel und $O(1)$/100-Step-Offline-Berechnung.
3. **`packages/game-config`:** Balance-Konfiguration ausschließlich für Welt 1 (`apex-syndicate` gemäß `DEC-13`).
4. **`packages/game-engine` & `packages/progression-system`:** Gebäudelogik, AI Manager, Research Tree, Missions, Daily Challenges, Focus Timer, Achievements & Prestige-Loop ohne UI-Abhängigkeit.
5. **Gate-Prüfung 07B:** Vitest-Unit-Suite (Fake-Timers, BuyMax/Bulk-Genauigkeit, Anti-Cheat-Toleranzen, Savegame-Migration) vollständig grün.

---

## 4. Phase 07C: Game Client, Backend & Supabase (`apps/` & `supabase/`)

1. **`apps/game-client` & `packages/ui-components`:**
   - SvelteKit 2 + Svelte 5 Runes + Tailwind CSS v4 (`DEC-10`, keine unnötigen UI-Fremdbibliotheken).
   - Dynamisch nachgeladene PixiJS v8 Datacenter-Visualisierung (`DEC-05`), IndexedDB Local-First Persistence (`DEC-03`) und nativer Web-Audio-Wrapper (`DEC-11`).
   - **Pflicht-Messung sofort nach erstem Build:** Initiales gzip/brotli-Bundle $\le 350\text{ KB}$ (`ISSUE-07`), Heap $\le 150\text{ MB}$, $16.6\text{ ms}$ Frame-Budget.
2. **`apps/backend` (Fastify v5, `DEC-08`) & `packages/reality-sync`:**
   - Implementierung von `POST /v1/sync/batch` (inkl. `baseStateVersion` → `409 CONFLICT_STATE_DIVERGENCE`), Focus-Timer, Idempotency-/Claim-Locks, Analytics (`authenticated` + 64 KB Limit), Leaderboards & DSGVO `DELETE /v1/profile/me`.
3. **`supabase/migrations/`:**
   - Tabellen, Indizes, `AS RESTRICTIVE` RLS-Schreibschutz-Policies, `(SELECT auth.uid()) = id` und `REVOKE EXECUTE` auf `SECURITY DEFINER`-Funktionen gegen lokalen Postgres-/Supabase-Container verifizieren.

---

## 5. Phase 07D: Mobile (Capacitor 8), E2E & Phase-2-Ausblick

- [ ] Playwright Desktop- & Mobile-E2E-Suite (`Onboarding`, `Offline-Return-Modal`, `Prestige-Reset`).
- [ ] Capacitor 8 Android/iOS-Bridge (`Capacitor.isNativePlatform()`, Haptics, Safe-Area-Insets, Thermal-Throttling bei Inaktivität).
- [ ] Nach stabilem **Apex Syndicate MVP** Freigabe von Phase 2 (`DEC-13`): Guilds, vollständiges `apps/admin-dashboard` sowie Welten 2 (`Chrono Forge`) und 3 (`Sovereign Island`).
