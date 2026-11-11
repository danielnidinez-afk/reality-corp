---
name: frontend-architecture
description: "Spezialisierter Skill für SvelteKit 5, TypeScript, modulare UI-Komponenten, State Management und saubere Trennung von UI und Tycoon-Simulation in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Frontend Architecture & State Management

## 1. Zweck
Dieser Skill definiert die architektonischen Richtlinien für das Web- und Desktop-Frontend von *REALITY CORP*. Er gewährleistet maximale Wartbarkeit, strikte Typsicherheit, reaktive Performance und eine klare Trennung zwischen Präsentation und Simulationslogik.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Neue Routen, Layouts oder Seiten in SvelteKit strukturiert werden.
- Globaler oder lokaler Anwendungszustand (Stores / Svelte 5 Runes `$state`, `$derived`, `$effect`) modelliert wird.
- Komponentenbibliotheken (UI-Karten, Dialoge, Tabs, Daten-Tabellen) entworfen werden.
- Re-Rendering-Performance oder State-Synchronisationsprobleme behoben werden müssen.

## 3. Arbeitsablauf
1. **Trennung von Engine und UI (Headless Core):**
   - Die Tycoon-Simulation (`simulation-core`) existiert als reines TypeScript-Modul ohne DOM- oder Framework-Abhängigkeiten.
   - Das Frontend abonniert State-Updates der Engine in regelmäßigen Zyklen (z.B. 10–20 Hz für UI-Zahlen, unabhängig von 60 Hz Render-Ticks).
2. **Svelte 5 Runes & Reaktivität:**
   - Verwende `$state` für mutable reaktive Felder.
   - Verwende `$derived` für berechnete Werte (niemals berechnete Werte manuell in `$effect` synchronisieren).
   - Halte `$effect` minimal: Nur für DOM-Seiteneffekte, Analytics oder Audio-Trigger.
3. **Modulare Ordnerstruktur:**
   ```
   src/
   ├── lib/
   │   ├── components/      # Wiederverwendbare UI-Primitiven (Buttons, Cards, Modals)
   │   ├── features/        # Domänenspezifische Features (Datacenter, Research, Talent, Finances)
   │   ├── engine/          # Simulationsbrücke & State Adapter
   │   ├── stores/          # Reaktive UI-Stores / Runes
   │   └── utils/           # Hilfsfunktionen, Formatierer
   └── routes/              # SvelteKit Routen
   ```
4. **Strikte Typsicherheit:**
   - `tsconfig.json` mit `strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes: true`.
   - Zod- oder Valibot-Schemas an allen Systemgrenzen (Savegames, API-Payloads).

## 4. Qualitätskriterien
- **Keine UI-Lag-Spikes:** Komponenten-Updates dürfen unter keinen Umständen den Main-Thread für $> 16$ ms blockieren.
- **Hohe Wiederverwendbarkeit:** UI-Primitiven müssen entkoppelt und isoliert im Storybook oder Test-Bed darstellbar sein.
- **Barrierefreiheit (a11y):** Vollständige Tastaturbedienbarkeit aller Kernmenüs, korrekte ARIA-Rollen und Labels.

## 5. Typische Fehler (Anti-Patterns)
- **Logik im Template:** Komplexe Rechenoperationen oder Business-Entscheidungen direkt im HTML-Template.
- **Zirkuläre Abhängigkeiten:** UI-Komponenten importieren Simulationsdienste, die wiederum UI-Status abfragen.
- **Over-Reactive Triggers:** Ungefilterte Re-Renders ganzer Tabellen bei jeder minimalen Änderung einer Unterressource.

## 6. Prüfschritte
- [ ] Werden alle Tycoon-Zahlen über zentrale Formatierer dargestellt (z.B. `formatCurrency(amount)`)?
- [ ] Besteht `npm run check` (Svelte-Check) ohne Warnungen und Typfehler?
- [ ] Sind alle UI-Texte und Labels für Lokalisierung (i18n) vorbereitet?

## 7. Konkrete Projektregeln für REALITY CORP
- Kein Zustand darf duplicated werden: Entweder lebt ein Wert im Simulationszustand oder im reinen UI-Zustand (wie z.B. `isModalOpen`).
- Alle UI-Eingaben (z.B. Slider für Forschungsinvestitionen) senden Aktionen/Commands an die Engine; sie manipulieren niemals direkt die Engine-Internals.

