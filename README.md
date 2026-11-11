# REALITY CORP: THE AI WORLD TYCOON

[![CI Pipeline](https://github.com/danielnidinez-afk/reality-corp/actions/workflows/ci.yml/badge.svg)](https://github.com/danielnidinez-afk/reality-corp/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x%20%7C%20Svelte%205-orange.svg)](https://kit.svelte.dev/)
[![PixiJS](https://img.shields.io/badge/PixiJS-8.x-ff69b4.svg)](https://pixijs.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#lizenz)

> **Erschaffe das mächtigste KI-Monopol der Weltgeschichte.**  
> *REALITY CORP* ist ein tiefgründiges Tycoon- & Incremental-Simulationsspiel, in dem du vom Garagen-Startup zum Betreiber planetarer Supercluster aufsteigst, GPU-Farmen verwaltest, KI-Modelle trainierst und Märkte beherrschst.

---

## 🌟 Kernfeatures & Gameplay-Säulen

- **Deterministischer Simulation Core:** Autonome Tick-Engine (100 % TypeScript, headless testbar).
- **Hybrid-Rendering:** SvelteKit 5 Runes für reaktive Management-Dashboards gepaart mit einer 60 FPS PixiJS (v8) 2D WebGL/WebGPU-Weltkarte.
- **Tiefgründige Ökonomie:** 5-Stufen-Ressourcensystem (`$RC`, `Compute FLOP/s`, `Energy kW`, `Data Shards`, `Equity Shares`) mit Big-Number-Mathematik (`break_infinity.js` / `BigVal`) ohne Floating-Point-Drift.
- **Mobile-First & Offline-Fähig:** Vollständige Spielbarkeit im Flugmodus (Local-First mit IndexedDB) und optimiert für $48\text{px}$ Touch-Ergonomie via Capacitor.
- **Enterprise-Sicherheit:** Supabase PostgreSQL mit Zero-Trust Row-Level Security (RLS) und serverseitiger Anti-Cheat-Validierung.

---

## 🏗️ Architektur & Repository-Struktur

```
REALITY-CORP/
├── .agent/
│   └── skills/             # 19 dedizierte Agent-Skills (Ökonomie, PixiJS, SvelteKit, etc.)
├── .agents/
│   └── rules/              # 13 verbindliche Architektur-, TS- & Sicherheitsregeln
├── .github/                # CI/CD Workflows, PR- & Issue-Templates
├── apps/                   # game-client (SvelteKit/PixiJS/Capacitor), backend (Fastify), admin-dashboard
├── docs/                   # Vollständige Projekt-, Architektur-, Security- & Audit-Dokumentation
├── packages/               # shared-types, game-config, economy-engine, game-engine, progression-system, reality-sync, ui-components
├── supabase/               # PostgreSQL Migrationen, RLS-Policies & RPCs
├── tests/                  # Economy-Benchmarks, Integration & Playwright E2E
├── AGENTS.md               # 14 verbindliche Kernprinzipien für alle Agenten
└── GEMINI.md               # Master Governance Entry Point
```

---

## 🚀 Schnellstart (Entwicklungsumgebung)

### Voraussetzungen
- Node.js 24 LTS (`engine-strict=true`)
- pnpm 10
- Git

### Installation & Lokaler Start
```bash
# Repository klonen
git clone git@github.com:danielnidinez-afk/reality-corp.git
cd reality-corp

# Abhängigkeiten installieren
pnpm install

# Entwicklungsserver starten
pnpm dev
```

---

## 🧪 Tests & Qualitätssicherung

```bash
# Statische Typprüfung
pnpm check

# Unit- & Integrationstests
pnpm test

# End-to-End Tests (Headless Browser)
pnpm test:e2e
```

---

## 📜 Governance & Regeln
Für Entwickler und KI-Agenten gilt strikt:
- **Keine direkten Commits auf `main`:** Alle Änderungen erfolgen über Feature-Branches (`feat/*`, `fix/*`) und Pull Requests auf `develop`.
- **Qualität vor Geschwindigkeit:** Siehe [AGENTS.md](file:///c:/Users/Daniel/Desktop/REALITY-CORP/AGENTS.md) und [CONTRIBUTING.md](file:///c:/Users/Daniel/Desktop/REALITY-CORP/CONTRIBUTING.md).

---

## 📄 Lizenz
Proprietary – Alle Rechte vorbehalten. Copyright © 2026 REALITY CORP Projektteam.

