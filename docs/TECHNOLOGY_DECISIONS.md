# TECHNOLOGY DECISIONS & STACK EVALUATION (PHASE 05)
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Datum:** 11. November 2026  
**Autor:** Chief Technical Architect  
**Status:** Master Architecture Specification

---

## 1. Evaluierung des Technologiestacks (Verifiziert anhand offizieller Dokumentation)

Jede Komponente des Stacks wurde gegen unsere lokale Laufzeitumgebung (**Node.js v24.15.0 LTS**, **Windows 11**, **npm 11**) sowie gegen aktuelle offizielle Spezifikationen geprüft.

| Technologie | Geprüfter Stand / Kompatibilität | Eignung für REALITY CORP | Bewertung |
| :--- | :--- | :--- | :--- |
| **SvelteKit (Svelte 5)** | SvelteKit 2 + Svelte 5 Runes (`$state`, `$derived`, `$effect`), `@sveltejs/adapter-static` mit `fallback: 'index.html'` | Ideal für reaktive Tycoon-Dashboards, minimalen Runtime-Overhead auf Mobilgeräten und nahtlose SPA-Bündelung für Capacitor. | **PASS (Gesetzt)** |
| **TypeScript** | TypeScript `5.x` im `strict`-Modus; kompatibel mit nativem Type-Stripping in Node.js 24 | Unverzichtbar für Branded Types (`RealityCash`, `ComputeFlops`), geteilte Verträge zwischen Client & Server und Refactoring-Sicherheit. | **PASS (Gesetzt)** |
| **PixiJS** | **PixiJS v8** (asynchrone `app.init()`, WebGPU-first mit WebGL2-Fallback) | Optimal für 2D-Datacenter-Visualisierung, Partikel-Datenströme und 60 FPS Mobile-Rendering. | **PASS (Gesetzt)** |
| **Tailwind CSS** | **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first `@import "tailwindcss"`) | Minimale Build-Konfiguration, extrem kleines CSS-Output-Bundle, schnelle Umsetzung von $48\text{px}$-Touch-Layouts. | **PASS (Gesetzt)** |
| **Node.js** | **Node.js v24.15.0 (Active LTS Krypton)**, Unterstützung bis April 2028 | Perfekte Basis für Build-Toolchain und autoritatives Backend; erlaubt identischen TypeScript-Engine-Code auf Client & Server. | **PASS (Gesetzt)** |
| **PostgreSQL** | **PostgreSQL 16/17** (über Supabase) | ACID-Transaktionen für Käufe/Belohnungen, JSONB für komplexe Spielstände, B-Tree-Indizes für Leaderboards und RLS. | **PASS (Gesetzt)** |
| **Supabase** | Auth, PostgREST, Edge Functions, Realtime, Supavisor Connection Pooler | Eliminiert Boilerplate für Auth und Datenhaltung; RLS erzwingt Zero-Trust auf Datenbankebene. | **PASS (Gesetzt)** |
| **Zod** | **Zod `^3.24+` bzw. `^4.x`** (Zero-Dependency; strikt auf **eine** Major-Version im Monorepo pinnen!) | Laufzeitvalidierung für API-Payloads, Savegames und Balance-Configs; verhindert `TS2589` durch einheitliche Workspace-Version. | **PASS (Gesetzt)** |
| **Vitest** | **Vitest `^5.x`** (erfordert Vite $\ge 6$, Node $\ge 20$), `vmThreads`/`vmForks`, Fake Timers | Höchste Ausführungsgeschwindigkeit für deterministische Tick-Tests und mehrtägige Ökonomie-Bot-Simulationen. | **PASS (Gesetzt)** |
| **Playwright** | **Playwright `^1.50+`**, volle Node 24 LTS Unterstützung | Verlässliche E2E-Tests mit Desktop- und Mobile-Viewport-Emulation sowie Web-First-Assertions. | **PASS (Gesetzt)** |
| **Capacitor** | **Capacitor 8** (erfordert Node $\ge 22$, Swift Package Manager Support für iOS) | Kompatibel mit Node 24; verpackt SvelteKit `adapter-static`-Builds direkt als native iOS-/Android-App inkl. Haptics & Storage. | **PASS (Gesetzt)** |
| **GitHub Actions** | `pnpm/action-setup@v4`, `actions/setup-node@v4` (Node 24, `cache: 'pnpm'`), `--frozen-lockfile` | Nahtlose CI/CD-Integration mit gezielten `--filter`-Jobs für Monorepo-Pakete. | **PASS (Gesetzt)** |

---

## 2. Verbindliche Architekturentscheidungen (ADRs)

### DEC-01: Modulares `pnpm`-Monorepo statt Polyrepo oder Turborepo/Nx
- **Entscheidung:** Einsatz von nativen `pnpm`-Workspaces (`pnpm-workspace.yaml`) ohne zusätzliche Orchestrierungs-Frameworks wie Nx oder Turborepo im MVP.
- **Begründung:** Ein einziges Root-Lockfile (`pnpm-lock.yaml`) spart Speicherplatz (relevant bei ~25.67 GB freiem Speicher auf `C:`), garantiert konsistente Dependency-Versionen (z. B. exakt eine Zod-Version) und erlaubt direkte TypeScript-Imports zwischen `packages/*` und `apps/*`.
- **Geprüfte Alternativen:**
  - *Polyrepo:* Hoher Synchronisationsaufwand für geteilte Engine-Typen; doppelte Wartung zwischen Client-Preview und Server-Validierung.
  - *Turborepo / Nx:* Unnötige Konfigurationskomplexität bei 3 Apps und 7 Paketen. Kann später nahtlos ergänzt werden, falls Build-Zeiten > 2 Minuten steigen.

### DEC-02: Modularer Node.js-Monolith + Supabase BaaS statt Microservices
- **Entscheidung:** Ein einzelner modularer Backend-Service (`apps/backend` auf Node.js 24, z. B. Fastify) kombiniert mit Supabase (PostgreSQL + Auth + RLS + RPCs). **Keine Microservices.**
- **Begründung:** Die autoritative Tycoon-Ökonomie erfordert, dass Client und Backend **exakt dieselbe deterministische Engine** (`@reality-corp/game-engine` & `@reality-corp/economy-engine`) ausführen. Ein Node.js-Monolith lädt diese Pakete direkt als Workspace-Dependencies ohne Serialisierungs-Overhead oder verteilte Service-Grenzen.
- **Geprüfte Alternativen:**
  - *Reine Supabase Edge Functions (Deno):* Cold Starts, Ausführungszeitlimits und unterschiedliche Module-Resolution zwischen Deno und Vite/Node erschweren das direkte Ausführen komplexer Monorepo-Workspace-Pakete bei Batch-Syncs. (Edge Functions bleiben optional für Webhooks.)
  - *Microservices (je ein Service für Guilds, Leaderboards, Economy, Auth):* Massive technische Überdimensionierung, Netzwerk-Latenz, verteilte Transaktionsprobleme.

### DEC-03: Hybrid-Autorität (Local-First Offline Play + Server-Authoritative Reconciliation)
- **Entscheidung:** Das Spiel ist lokal vollständig im Flugmodus spielbar (`IndexedDB` + deterministische Client-Engine). Alle persistenten Fortschritte, Käufe, Belohnungen, Focus-Timer-Boosts und Leaderboard-Einträge werden bei Online-Verbindung über signierte/sequenzierte Command-Batches vom Backend (`apps/backend`) **deterministisch nachgerechnet und autoritativ bestätigt**.
- **Begründung:** Löst den Zielkonflikt zwischen `AGENTS.md` Regel #14 (100 % Offline-Funktionalität) und der Sicherheitsanforderung (Server-authoritative Economy & Anti-Cheat). Der Client hat null Wartezeit bei Klicks (Optimistic Local Execution), während der Server manipulierte Deltas, Zeitreisen oder doppelte Claims mathematisch ablehnt.
- **Geprüfte Alternativen:**
  - *Reines Always-Online Server-Tick-Streaming:* Spiel bricht im Flugmodus oder bei schlechtem Mobilfunknetz ab.
  - *Reiner Client-Trust (Local Savegame Upload):* Triviale Manipulation von Cash/Timestamps über Browser-DevTools; unbrauchbar für Leaderboards und Guilds.

### DEC-04: Big-Number-Strategie (`break_infinity.js` hinter eigenem Adapter)
- **Entscheidung:** Verwendung von `break_infinity.js` gekapselt hinter einem projektspezifischen Value-Wrapper (`BigVal` in `packages/economy-engine`). Speicherung in PostgreSQL/JSON als normalisiertes Paar `{ m: number, e: number }` (Mantisse + Exponent) bzw. in separaten Spalten `(mantissa float8, exponent int4)` für sortierbare Leaderboards.
- **Begründung:** Offizielle Benchmarks zeigen, dass `break_infinity.js` bei Log/Pow-Operationen **50x–400x schneller** ist als `decimal.js` (welches auf langsame String-/Array-Arbitrary-Precision setzt). Gleichzeitig deckt $10^{9\times 10^{15}}$ sämtliche Tycoon-Skalierungen ab. Durch die Adapter-Kapselung ist ein späterer Wechsel auf `break_eternity.js` ohne Änderung der Spielsysteme möglich.
- **Geprüfte Alternativen:**
  - *Native JS `number`:* Präzisionsverlust über $2^{53}-1$ ($\approx 9 \times 10^{15}$), Overflow ab $1.8 \times 10^{308}$.
  - *`decimal.js`:* Zu langsam für 20+ FPS/Tick-Loops auf Mobilgeräten; speicherintensiv.
  - *`break_eternity.js`:* Höherer Rechenaufwand durch Layer-Verzweigung; für REALITY CORP (Wirtschafts-Tycoon statt abstraktem Tetration-Endgame) erst nötig, falls Werte $> 10^{10^{15}}$ geplant würden.

### DEC-05: Hybrid-UI (PixiJS v8 Canvas + Svelte 5 DOM Overlay)
- **Entscheidung:** PixiJS v8 rendert ausschließlich die interaktive Weltkarte / Datacenter-Visualisierung (`apps/game-client`), während sämtliche Menüs, Zahlenanzeigen, Forschungsbäume und Listen als Svelte 5 DOM/Tailwind-v4-Komponenten (`packages/ui-components`) über dem Canvas liegen.
- **Begründung:** Textrendering, Scroll-Listen, Accessibility (WCAG 2.1 AA, Screenreader) und responsive Breakpoints sind im DOM/Svelte massiv wartbarer und performanter als in reinem Canvas-UI. PixiJS konzentriert sich auf WebGL/WebGPU-Sprites und Partikel mit $< 30$ Draw Calls.
- **Geprüfte Alternativen:**
  - *Alles in PixiJS Canvas:* Schlechte Barrierefreiheit, aufwändige Text-Layouts, keine nativen Formular-/Scroll-Mechaniken.
  - *Reines HTML/DOM ohne PixiJS:* Eingeschränkte Partikel-, Kamera-Pan/Zoom- und GPU-Visualisierungs-Performance auf Mobilgeräten.

### DEC-06: Admin-Dashboard als eigene schlanke App (`apps/admin-dashboard`)
- **Entscheidung:** Auslagerung administrativer Werkzeuge (Live-Events, Balance-Config-Inspektor, Anti-Cheat-Anomalien, Spieler-Support) in eine separate SvelteKit-App, geschützt durch Supabase Auth + Admin-Rollen-Claim + serverseitige Backend-Prüfung.
- **Begründung:** Hält den Bundle-Umfang von `apps/game-client` klein ($\le 350\text{KB}$ Ziel) und verhindert, dass Admin-UI-Code in Mobile-App-Stores ausgeliefert wird.
- **Geprüfte Alternativen:**
  - *Admin-Routen innerhalb von `game-client`:* Erhöht Bundle-Größe und Sicherheitsrisiko bei Client-Code-Analyse.
  - *Reine SQL-Queries im Supabase Studio:* Fehleranfällig bei JSONB-Spielständen und fehlende Audit-Logs für Support-Aktionen.

### DEC-07: Single-World MVP (`Apex Syndicate`) mit Multi-World-Datenmodell
- **Entscheidung:** Jede Tabelle, Config und Engine-Funktion führt explizit eine `world_id` (`'apex-syndicate' | 'chrono-forge' | 'sovereign-island'`), doch im MVP ist ausschließlich `apex-syndicate` freigeschaltet und mit Content bestückt.
- **Begründung:** Verhindert kostspielige Datenbank- und Savegame-Migrationen beim späteren Launch von Welt 2 (*Chrono Forge*) und Welt 3 (*Sovereign Island*), ohne den MVP-Zeitplan mit unfertigem Content zu belasten.
