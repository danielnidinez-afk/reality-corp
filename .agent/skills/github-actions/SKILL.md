---
name: github-actions
description: "Experten-Skill für GitHub Actions CI/CD Workflows, deterministische Pipeline-Ausführung, Caching-Strategien, Matrix-Builds und automatisierte Security Scans."
metadata:
  version: "1.0.0"
  license: MIT
---

# GitHub Actions CI/CD Automation Standards

## 1. Zweck
Dieser Skill definiert Vorlagen, Sicherheitsregeln und Performance-Tuning für kontinuierliche Integration und automatisierte Deployments via GitHub Actions.

## 2. Kernrichtlinien

### 2.1 Sicherheitsregeln (Least Privilege)
- Jeder Workflow muss minimale Token-Berechtigungen explizit deklarieren:
  ```yaml
  permissions:
    contents: read
    pull-requests: write
  ```
- Niemals Third-Party Actions mit dynamischem `@master` oder `@main` Tag einbinden. Verwende feste Commit-SHAs oder verifizierte Release-Tags (z.B. `actions/checkout@v4`).
- Speichere Secrets niemals im Klartext in Logs (`add-mask` verwenden oder sensible Tokens in GitHub Secrets verwalten).

### 2.2 Schnelle Pipelines durch Caching
- Verwende Paketmanager-integriertes Caching:
  ```yaml
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: 24
      cache: 'pnpm'
  ```
- Entkopple voneinander unabhängige Jobs (Linting, Unit Tests, E2E Tests), damit sie parallel laufen.

## 3. Typische Fehler & Anti-Patterns
- **Unbegrenzte Timeouts:** Fehlendes `timeout-minutes: 15`, wodurch hängende Prozesse die CI-Runner-Minuten aufbrauchen.
- **Redundantes Bauen:** Wiederholtes Ausführen von `pnpm build` in separaten Jobs statt Verwendung von Build-Artefakten (`actions/upload-artifact`).

