# GITHUB WORKFLOW & BRANCHING STRATEGY
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Datum:** 11. November 2026  
**Status:** Aktiviert & Verbindlich

---

## 1. Branch-Hierarchie & Lebenszyklus

Das Repository verwendet ein adaptiertes Git-Flow-Modell mit strikter Branch-Protection:

```
[main]          <-- Produktionsreif, stabil, getaggt (v1.0.0, etc.)
  ^
  | (Pull Request mit Release-Audit)
[develop]       <-- Integrations-Branch für das AI-Entwicklerteam
  ^
  | (Pull Request mit CI-Tests & Peer-Review)
[feat/*, fix/*] <-- Kurzlebige Feature- und Bugfix-Branches
```

### Branch-Spezifikation

| Branch | Rolle | Schutzstufe | Erlaubte Commits |
| :--- | :--- | :--- | :--- |
| **`main`** | Produktivcode & Releases | **Höchste (Protected)** | Ausschließlich PR-Merges von `develop`. Direkte Commits verboten. |
| **`develop`** | Integration aller Features | **Hoch (Protected)** | Ausschließlich PR-Merges von `feat/*`, `fix/*`, `perf/*`. |
| **`feat/<name>`** | Neues Gameplay/UI-Modul | Entwickler-Branch | Squash-and-Merge in `develop` nach erfolgreicher CI-Pipeline. |
| **`fix/<name>`** | Fehlerbehebung | Entwickler-Branch | Merge in `develop` (oder Hotfix in `main` via Release-Audit). |
| **`perf/<name>`** | Performance-Optimierung | Entwickler-Branch | Erfordert Vorher/Nachher-Benchmark im PR. |

---

## 2. Conventional Commits Standard

Jeder Commit muss folgendes Format besitzen:
`type(scope): prägnante Beschreibung im Imperativ`

### Beispiele
- `feat(economy): add exponential scaling formula for GPU cluster cooling`
- `fix(savegame): resolve timestamp drift during offline calculation`
- `test(simulation): add headless tick benchmark for 1000 agents`
- `docs(mcp): document Supabase MCP integration`
- `chore(deps): update svelte to v5.2`

---

## 3. GitHub Actions CI Pipeline ([`.github/workflows/ci.yml`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.github/workflows/ci.yml))

Die kontinuierliche Integrations-Pipeline führt bei jedem Push und PR auf `main` und `develop` folgende Prüfungen aus:

1. **`typecheck_and_lint`:** Führt `pnpm check` (Svelte/TypeScript) und Linter aus.
2. **`unit_tests`:** Führt die Vitest-Suite mit Fake-Timers aus.
3. **`build_verification`:** Verifiziert die Erstellung der Produktions-Bundles.
4. **`security_audit`:** Scannt Abhängigkeiten auf bekannte Sicherheitslücken (`npm audit`).

---

## 4. Branch Protection Rules (Soll-Konfiguration für GitHub)

Sobald das Remote-Repository auf GitHub angelegt und verbunden ist, werden folgende Branch Protection Rules aktiviert:

### Für `main`:
- [x] **Require pull request before merging** (Mindestens 1 Approval).
- [x] **Require status checks to pass before merging:**
  - `Typecheck & Lint`
  - `Unit & Integration Tests`
  - `Build Integrity Verification`
- [x] **Do not allow bypassing the above settings.**
- [x] **Require linear history** (Rebase / Squash).
- [x] **Include administrators** (Regeln gelten auch für Owner/Admins).

### Für `develop`:
- [x] **Require pull request before merging.**
- [x] **Require status checks to pass before merging.**
- [x] **Require branches to be up to date before merging.**

