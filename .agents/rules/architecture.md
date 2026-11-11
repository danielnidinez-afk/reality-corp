# Architectural Governance & System Boundaries

## 1. Systemübersicht & Schichtenarchitektur
REALITY CORP: THE AI WORLD TYCOON basiert auf einer strikt entkoppelten Drei-Schichten-Architektur:

1. **Simulation Core Pakete (`packages/economy-engine`, `packages/game-engine`, `packages/progression-system`):**
   - 100 % reine TypeScript-Logik ohne DOM, Svelte- oder Pixi-Abhängigkeiten.
   - Deterministische State-Machine, Tick-Loops, Formeln, Event-Bus und Savegame-Serialisierer.
   - Vollständig isoliert im Node/Browser-Headless-Runner testbar.
2. **Presentation & UI Layer (`apps/game-client`, `apps/admin-dashboard`, `packages/ui-components`):**
   - SvelteKit 5 für reaktive Management-Screens, Übersichten, Detailpanels und Audio-Trigger.
   - PixiJS (v8) Canvas für die interaktive 2D-Welt, Datacenter-Grid und animierte Agentenströme.
   - Liest den Zustand der Simulation Engine unidirektional über reaktive State-Stores (`packages/reality-sync`).
3. **Backend & Persistence Layer (`apps/backend`, `supabase/`):**
   - PostgreSQL mit Row-Level Security (RLS) und atomaren RPCs (`SECURITY DEFINER` nur für `service_role`).
   - Asynchroner Spielstands-Abgleich, deterministische Batch-Replay-Validierung, Highscores und Globale Events.

## 2. Unidirektionaler Datenfluss
- Die UI sendet **Commands/Events** an den Simulation Core (z.B. `BuyUpgradeCommand`, `AssignAgentCommand`).
- Der Simulation Core führt Validierung und Zustandsmutation deterministisch durch.
- Der Simulation Core emittiert Zustands-Snapshots oder Deltas an die UI-Presenter.
- **Verboten:** Direktes Überschreiben interner Engine-Felder aus Svelte-Komponenten heraus.

## 3. Modularität & Single Responsibility
- Jedes Modul erfüllt genau eine fachliche Aufgabe (z.B. `EnergyGridSystem`, `ComputeClusterSystem`, `MarketDemandSystem`).
- Module kommunizieren über den zentralen typisierten `EventBus`.
- Zirkuläre Abhängigkeiten zwischen Modulen sind verboten und werden durch statische Architektur-Checks geblockt.

