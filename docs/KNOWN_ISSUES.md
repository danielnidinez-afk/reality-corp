# KNOWN ISSUES, RESOLVED AUDIT DEFECTS & ENVIRONMENT WARNINGS
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Stand:** 11. November 2026 (Phase 06 Security & Quality Gate)

---

## 1. Aktive Warnungen & Externe Blocker

### ISSUE-01: Begrenzter freier Festplattenspeicher auf Laufwerk `C:`
- **Schweregrad:** `WARNING`
- **Befund:** Auf Laufwerk `C:` stehen **25,60 GiB** (**27,48 GB** / `27.484.712.960 Bytes`, `Get-PSDrive C`) freier Speicherplatz zur Verfügung.
- **Risiko:** Container-Images (Docker/Supabase), Playwright-Browser-Binaries und Android/Capacitor-SDKs können diesen Puffer rasch aufzehren.
- **Gegenmaßnahmen:**
  - Nutzung von `pnpm` (zentraler Content-Addressable Store reduziert doppelte Pakete zwischen Apps und Paketen).
  - Strenge Dependency-Disziplin (`DEC-10`, `DEC-11`: Verzicht auf unnötige UI- und Audio-Drittpakete im MVP).
  - Kein unnötiges paralleles Vorhalten ungenutzter Browser-/Emulator-Images.

### ISSUE-02: Docker Desktop Daemon inaktiv
- **Schweregrad:** `BLOCKED` (für containerisierte Datenbank-/Backend-Tests)
- **Befund:** Docker CLI (`v29.5.2`) ist installiert, die Linux-Engine-Pipe und die WSL2-Instanz `docker-desktop` sind jedoch gestoppt.
- **Auswirkung:** Lokale Supabase-/PostgreSQL-Container sowie Live-RLS- und Migrationstests können erst ausgeführt werden, wenn Docker Desktop gestartet wird.
- **Abhilfe:** Starten von Docker Desktop vor Beginn der Backend-/Datenbank-Implementierung in Phase 07/08.

### ISSUE-03: `pnpm` CLI noch nicht global verfügbar
- **Schweregrad:** `WARNING` / `BLOCKED` (für lokale `pnpm`-Ausführung)
- **Befund:** `pnpm` ist aktuell nicht im globalen System-`PATH` installiert. Das globale `npm`-Präfix (`npm config get prefix` $\rightarrow$ `C:\Users\Daniel\AppData\Roaming\npm`) ist jedoch ohne Administratorrechte beschreibbar (`C:\Program Files\nodejs` hat nur Leserechte; `corepack.cmd` `0.34.6` ist dort vorhanden).
- **Abhilfe:** In Phase 07 nach Benutzerfreigabe `npm install -g pnpm@10` in das beschreibbare Benutzer-Präfix installieren.

### ISSUE-04: GitHub CLI (`gh`) fehlt & Remote Branch Protection unverifiziert
- **Schweregrad:** `BLOCKED` (für automatisierte GitHub-API-Prüfung)
- **Befund:** `gh` ist auf dem System nicht installiert. Dadurch konnten serverseitige GitHub Branch Protection Rules auf `main` und `develop` sowie der exakte Zustand von `origin` im Phase-06-Audit nicht automatisiert per API verifiziert werden.
- **Abhilfe:** Manuelle Kontrolle bzw. Einrichtung der Branch Protection Rules im GitHub Web-Interface (gemäß [`docs/GITHUB_WORKFLOW.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/GITHUB_WORKFLOW.md)) sowie kontrolliertes Pushen der lokalen `develop`-Commits durch den Benutzer.

### ISSUE-05: Node.js v24 & Python 3.14 Kompatibilitätsrisiko bei Native Addons
- **Schweregrad:** `WARNING`
- **Befund:** Moderne Laufzeitversionen können bei älteren `node-gyp`-C++-Addons Build-Probleme verursachen.
- **Gegenmaßnahmen:** Strikte Bevorzugung reiner TypeScript/ESM-Pakete (z. B. `zod`, `break_infinity.js`, `fastify`) sowie Supply-Chain-Härtung durch `ignore-scripts=true` in [`.npmrc`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.npmrc).

### ISSUE-06: Fehlende ausführbare Codebasis & Live-Supabase-Anbindung vor Phase 07
- **Schweregrad:** `BLOCKED` (erwarteter Phasen-Status vor MVP-Scaffolding)
- **Befund:** Gemäß Phase-05-Vorgabe existiert noch keine Root-`package.json`, `pnpm-lock.yaml`, `tsconfig.base.json` und kein verknüpftes Supabase-Projekt. Laufzeit-Builds, `pnpm check`, `pnpm test`, `pnpm audit` und Live-RLS-Tests sind daher bis zum Start von Phase 07 nicht ausführbar.

### ISSUE-07: Ungenutzte globale MCP-Einträge & Bundle-Budget-Risiko PixiJS v8
- **Schweregrad:** `WARNING`
- **Befund 1 (MCP):** Im globalen Antigravity-Profil sind `unity`, `unity-editor` und `ai-game-developer` aktiv, obwohl REALITY CORP auf SvelteKit 5 + PixiJS v8 setzt (Least-Privilege-Hinweis; keine Workspace-Risiken beobachtet).
- **Befund 2 (Performance):** Das Ziel von $\le 350\text{ KB}$ für das initiale gzip/brotli-Bundle (inkl. Svelte 5 + PixiJS v8) erfordert konsequentes Code-Splitting / dynamisches `import()` für die PixiJS-Scene-Pipeline und sekundäre Panels. Muss direkt beim ersten Phase-07-Build gemessen werden.

---

## 2. Im Phase-06-Audit behobene Mängel (Resolved)

| ID | Ursprünglicher Befund | Durchgeführte Korrektur | Status |
| :--- | :--- | :--- | :--- |
| **RES-01** | [`.github/workflows/ci.yml`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.github/workflows/ci.yml) enthielt `\|\| true` (Security Audit Bypass), `\|\| npm install` und `\|\| npm run ... --if-present` | Pipeline strikt auf `pnpm/action-setup@v4` (v10), `--frozen-lockfile`, fehlerbrechendes `pnpm audit --audit-level=high` und direkte `pnpm`-Skripte umgestellt | **RESOLVED** |
| **RES-02** | Doppeltes Regelverzeichnis `.agent/rules/` mit CRLF-Hash-Abweichung und veraltete Phase-03-Pfade (`simulation-core`, `client-ui`, `packages/backend`) | `.agent/rules/` entfernt; [`.gitattributes`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.gitattributes) für LF-Normalisierung ergänzt; [`.agents/rules/architecture.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.agents/rules/architecture.md) und [`docs/AGENT_ROLES.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/AGENT_ROLES.md) auf Phase-05-Module bereinigt | **RESOLVED** |
| **RES-03** | Fehlerhafte PostgreSQL-RLS-Write-Deny-Beispielsyntax (`FOR ALL USING (false)` ohne `AS RESTRICTIVE`) und fehlendes `REVOKE EXECUTE` auf `SECURITY DEFINER`-RPCs | `AS RESTRICTIVE` + `(SELECT auth.uid()) = id` + `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` sowie DSGVO-Retention/Kaskade in [`docs/DATABASE_DESIGN.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/DATABASE_DESIGN.md) und [`.agents/rules/backend-security.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.agents/rules/backend-security.md) ergänzt | **RESOLVED** |
| **RES-04** | API-Lücken: fehlendes Multi-Device-Locking auf `sync/batch`, unauthentifiziertes `analytics/batch`, widersprüchliche Focus-Timer-Offline-Aussage, Race-Condition-Lücke auf `focus/complete` | `baseStateVersion` (`409 CONFLICT_STATE_DIVERGENCE`), Auth+64-KB-Limit für Analytics, `DELETE /v1/profile/me`, einheitliche Focus-Timer-Regel inkl. atomarem `status = 'active'` SQL-Lock in [`docs/API_SPECIFICATION.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/API_SPECIFICATION.md) & [`docs/TECH_ARCHITECTURE.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/TECH_ARCHITECTURE.md) | **RESOLVED** |
| **RES-05** | Widersprüche in Regeln, Skills, Templates, `README.md` & `AGENT_ROLES.md` (`Decimal` vs. `BigVal`, `npm` vs. `pnpm`, alte Phase-03-Modulnamen, nicht existierender `typescript`-Skill, veraltete `RULES_VALIDATION.md`-Bytes) | Bereinigt in [`.agents/rules/`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.agents/rules), `.agent/skills/{game-economy,automated-testing,frontend-architecture,github-actions,release-audit}/SKILL.md`, [`README.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/README.md), [`.github/pull_request_template.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.github/pull_request_template.md), [`docs/AGENT_ROLES.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/AGENT_ROLES.md), [`docs/AI_GOVERNANCE.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/AI_GOVERNANCE.md), [`docs/GITHUB_WORKFLOW.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/GITHUB_WORKFLOW.md) & [`docs/RULES_VALIDATION.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/RULES_VALIDATION.md) | **RESOLVED** |
| **RES-06** | Ungetrackter Vorentwurf `packages/` (`simulation-core` / `shared-types`), veralteter lokaler Branch `feat/core-engine-scaffold` (0 eigene Commits) sowie fehlende `.npmrc` & `.env.example` | Entwurf und leerer Branch entfernt; [`.npmrc`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.npmrc) (`ignore-scripts=true`, `save-exact=true`, `engine-strict=true`) und [`.env.example`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.env.example) angelegt | **RESOLVED** |
| **RES-07** | Offene Architekturentscheidungen (`DEC-08` bis `DEC-13`) aus Phase 05 | Festgelegt in [`docs/TECHNOLOGY_DECISIONS.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/TECHNOLOGY_DECISIONS.md) (Fastify v5, Zod `^3.24.2`, Tailwind v4 Eigenkomponenten, Web Audio Wrapper, `break_infinity.js`, klarer Apex-Syndicate-MVP-Schnitt) | **RESOLVED** |
