# SKILL REGISTRY: REALITY CORP
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Stand:** 11. November 2026  
**Verantwortlicher Architekt:** Leitender technischer Architekt (Google Antigravity)

---

## 1. Übersicht & Architektur der Agent Skills

Die Skill-Architektur von *REALITY CORP* ist zweistufig aufgebaut:
1. **Workspace-Spezifische Skills (`.agent/skills/`):** Direkt im Projektversionierungssystem verankert. Sie enthalten projektspezifische Domänenlogik (Ökonomie, Tycoon-Mechaniken, PixiJS-Renderpipeline, Sicherheitsregeln, etc.).
2. **Globale & Offizielle Skills:** Vom Agentensystem bzw. offiziellen Herstellern (Supabase, Google, Community) bereitgestellt für allgemeine Best Practices und Tool-Integrationen.

---

## 2. Vollständige Skill-Matrix

| Skill-Identifier | Typ / Herkunft | Status | Lizenz | Primärer Zweck |
| :--- | :--- | :--- | :--- | :--- |
| **`game-economy`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | Währungsflüsse, Multi-Tier-Ökonomie, Big-Number-Math, Sinks & Sources |
| **`game-balancing`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | Pacing, TTNM (Time to Next Milestone), Dopamin-Loops, Prestige-Skalierung |
| **`idle-game-design`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | Offline-Ertragsberechnung, Savegame-Versioning, Session-UX, Time-Skip-Schutz |
| **`pixijs-development`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | 2D WebGL/WebGPU Rendering, Datacenter-Grid, Spritesheets, Viewport-Culling |
| **`mobile-optimization`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | Touch-Ergonomie ($48\text{px}$ Targets), Safe-Area Insets, Akku-Drosselung |
| **`frontend-architecture`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | SvelteKit 5, Svelte Runes (`$state`, `$derived`), Trennung von UI und Engine |
| **`backend-security`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | Supabase RLS Zero-Trust, Anti-Cheat Validierung, Secret Isolation |
| **`database-design`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | PostgreSQL Schema, Normalisierung vs. JSONB, Indizierung, Supabase Migrationen |
| **`code-review`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | PR Quality Gate, Minimal Change Principle, Blocker/Warning Klassifizierung |
| **`automated-testing`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | Vitest Testpyramide, Fake Timers, Headless Simulation Benchmark Bots |
| **`performance-audit`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | $16.6\text{ms}$ Frame-Budget, Heap-Profiling, Memory-Leak-Erkennung |
| **`release-audit`** | Eigenentwicklung | **AKTIV** | Proprietary (Projekt) | SemVer, Release-Zertifikate, Abwärtskompatibilität alter Spielstände |
| **`supabase`** | Offiziell (Supabase) | **INSTALLIERT**| MIT | Auth, Storage, Edge Functions, Realtime, Client-Libraries (`@supabase/ssr`) |
| **`supabase-postgres-best-practices`** | Offiziell (Supabase) | **INSTALLIERT**| MIT | 8 Performance-Kategorien (Query, Conn, RLS, Schema, Locks, Monitor) |
| **`sveltekit`** | Kuratiert (Open Source) | **INSTALLIERT**| MIT | SvelteKit 2 / Svelte 5 Runes, Routing, Actions, progressive Steigerung |
| **`playwright`** | Kuratiert (Open Source) | **INSTALLIERT**| Apache-2.0 | Resiliente E2E-Tests, User-First Locators, automatisches Warten |
| **`vitest`** | Kuratiert (Open Source) | **INSTALLIERT**| MIT | Ultra-schnelle Unit- & Integrationstests, ESM Mocks, Snapshot Testing |
| **`github-actions`** | Kuratiert (Open Source) | **INSTALLIERT**| MIT | CI/CD Pipelines, Least-Privilege Permissions, Action Caching |
| **`capacitor`** | Kuratiert (Open Source) | **INSTALLIERT**| MIT | Cross-Platform Bridge (iOS/Android), Native Haptics, App Lifecycle |

---

## 3. Globale Agent-Skills (im Antigravity-System)

Zusätzlich stehen über das Antigravity-System spezialisierte globale Agency-Skills zur Verfügung:
- `agency-accessibility-auditor` (WCAG 2.1 AA Compliance)
- `agency-backend-architect` (Cloud & Distributed Systems)
- `agency-security-engineer` (Threat Modeling & Penetration Defense)
- `agency-game-designer` (Core Loops & Mechanics Architecture)
- `agency-game-audio-engineer` (Spatial & Adaptive Audio Pipelines)
- `agency-reality-checker` (Unnachgiebige Verifikation & QA Gates)

