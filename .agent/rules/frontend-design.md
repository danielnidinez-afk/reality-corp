# Frontend Design & SvelteKit Governance

## 1. Svelte 5 Runes Standard
- Ausschließlich moderne Svelte 5 Syntax verwenden:
  - `$state()` für reaktive primitive und komplexe Variablen.
  - `$derived()` / `$derived.by()` für berechnete Werte.
  - `$props()` für Komponenten-Properties.
- **Verbot:** Manuelle State-Synchronisationen über `$effect()`. Ein `$effect()` darf ausschließlich für browser-spezifische Seiteneffekte (DOM-Fokus, Audio-Wiedergabe, Canvas-Resize) eingesetzt werden.

## 2. Komponenten-Hierarchie & Layout
- **Atoms & Molecules:** Wiederverwendbare, zustandslose Komponenten (`Button`, `Card`, `Badge`, `NumberCounter`) in `src/lib/components/ui/`.
- **Organisms & Features:** Domänenspezifische Verbund-Panels (`DatacenterRackView`, `ResearchTree`, `FinancialLedger`) in `src/lib/features/`.
- **Pages & Routes:** Dienen ausschließlich dem Routing, Datenladen (`load`-Funktion) und Zusammensetzen der Feature-Panels.

## 3. Responsives Tycoon-Layout
- **Mobile-First & Adaptive:** Layout muss nahtlos auf Bildschirmen von 360px Breite bis 4K-Monitoren skalieren.
- Auf Mobilgeräten werden komplexe Tabellen als scrollbare Cards oder kompakte Akkordeons gerendert.
- Bottom-Bar-Navigation auf Mobilgeräten für Daumen-Erreichbarkeit; Sidebar-Navigation auf Desktop.

## 4. Barrierefreiheit (a11y) & Usability
- Alle interaktiven Elemente müssen über die Tastatur bedienbar sein (`Tab`, `Enter`, `Space`, `Escape`).
- Kontrastverhältnisse nach WCAG 2.1 AA (mindestens 4.5:1 für Fließtext, 3:1 für UI-Elemente).
- Zahlenwerte erhalten verständliche ARIA-Labels (z.B. `aria-label="1.24 Milliarden Reality Dollar"`).
