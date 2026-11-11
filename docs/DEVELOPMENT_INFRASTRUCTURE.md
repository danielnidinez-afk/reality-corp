# DEVELOPMENT INFRASTRUCTURE & REPOSITORY BLUEPRINT
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Datum:** 11. November 2026  
**Status:** Phase 04 abgeschlossen

---

## 1. Übersicht der Entwicklungsinfrastruktur

Die Entwicklungsumgebung von *REALITY CORP* wurde für maximale Sicherheit, Reproduzierbarkeit und professionelles Teamwork zwischen Mensch und KI-Agenten ausgelegt:

```
+-------------------------------------------------------------------------+
|                           DEVELOPMENT STACK                             |
+------------------------------------+------------------------------------+
| Local Toolchain                    | CI/CD & Cloud Infrastructure       |
+------------------------------------+------------------------------------+
| - Git (Branch: develop/main)       | - GitHub Actions (.github/workflows)|
| - Node.js 24 + pnpm                | - Automated Typecheck & Lint       |
| - SvelteKit 5 + TypeScript (Strict)| - Vitest Unit-Runner               |
| - PixiJS 8 (WebGL/WebGPU)          | - Production Build Verification    |
| - Antigravity Agent Swarm          | - Security Vulnerability Audit     |
| - Puppeteer & REA MCP Server       | - Supabase Backend (Target)        |
+------------------------------------+------------------------------------+
```

---

## 2. Git & Branching Konfiguration

- **Repository Root:** `c:\Users\Daniel\Desktop\REALITY-CORP`
- **Remote `origin`:** `https://github.com/danielnidinez-afk/reality-corp.git` (verbunden)
- **Initialer Commit:** Hash `619d8ca` auf `main` / `origin/main`.
- **Aktiver Arbeitszweig:** `develop` (lokale Weiterentwicklung ab Phase 05/06 zum Push bereit).
- **Branch-Strategie:**
  - `main`: Nur für getaggte, produktionsreife Releases.
  - `develop`: Zentraler Integrationszweig.
  - `feat/*`: Feature-Entwicklungen.
  - `fix/*`: Defektbehebungen.
- **Sicherheits-Barriere:** Direkte Commits auf `main` sind verboten.

---

## 3. GitHub Schutzmechanismen & Templates

Folgende Vorlagen und Richtlinien wurden hinterlegt:
- [`.gitignore`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.gitignore): Vollständiger Schutz gegen das versehentliche Einchecken von `node_modules`, Build-Artefakten, `.env`-Dateien, Credentials und mobilen Build-Dateien.
- [`README.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/README.md): Umfassende Projektübersicht, Schnellstartanleitung und Badges.
- [`CONTRIBUTING.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/CONTRIBUTING.md): Git-Flow, Conventional Commits und PR-Prozess.
- [`SECURITY.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/SECURITY.md): Vertrauliche Sicherheitsmeldungen und RLS-Standards.
- [`.github/pull_request_template.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.github/pull_request_template.md): PR-Struktur mit Testnachweisen und Komponenten-Checkliste.
- [`.github/ISSUE_TEMPLATE/`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.github/ISSUE_TEMPLATE): Strukturierte Vorlagen für Bug-Reports und Feature-Vorschläge.
- [`.github/workflows/ci.yml`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/.github/workflows/ci.yml): Parallele CI-Jobs für Typenprüfung, Tests, Builds und Security-Audits.

---

## 4. MCP-Integrationsstatus

| Tool / Server | Status | Verwendung |
| :--- | :--- | :--- |
| **Dateisystem** | Native Tools aktiv | Hochsicherer, workspace-beschränkter Dateizugriff. |
| **Puppeteer** | MCP aktiv | Headless Browser Automatisierung und UI-Rendering. |
| **REA** | MCP aktiv | Reverse Engineering, Heap Profiling, Crash-Diagnose. |
| **Supabase** | Bereit zur Anbindung | Offizielles Plugin steht im Marketplace bereit. |
| **GitHub** | Bereit zur Anbindung | Erfordert persönliche Freigabe / GitHub PAT. |

---

## 5. Offene Freigaben & Nächste Schritte

Das private GitHub-Remote (`origin`) ist bereits verknüpft; für den laufenden CI/CD-Schutz sind noch folgende Benutzerschritte erforderlich:
1. **Branch Protection auf GitHub aktivieren:** Schutzregeln für `main` und `develop` gemäß [`docs/GITHUB_WORKFLOW.md`](file:///c:/Users/Daniel/Desktop/REALITY-CORP/docs/GITHUB_WORKFLOW.md) in den Repository-Einstellungen einschalten.
2. **Aktuellen `develop`-Stand pushen:**
   ```bash
   git push origin develop
   ```
3. **Optionale MCP-Plugins verknüpfen:** Supabase-MCP und GitHub-MCP nach Token-/Konto-Freigabe aktivieren.

