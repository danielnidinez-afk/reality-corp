---
name: performance-audit
description: "Spezialisierter Skill für Profiling, Frame-Budget-Überwachung, Memory-Leak-Erkennung, Core Web Vitals und Garbage-Collection-Tuning in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Performance Audit & Memory Profiling

## 1. Zweck
Dieser Skill regelt die systematische Messung, Diagnose und Beseitigung von Performance-Engpässen in *REALITY CORP*. Er verhindert Frame-Drops, unkontrolliertes Memory-Wachstum und lange Ladezeiten.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Die Framerate unter 60 FPS sinkt (Micro-Stutters / Jank).
- Der RAM-Verbrauch des Browsers oder der WebView über längere Spielsitzungen kontinuierlich ansteigt.
- Lighthouse- oder Web-Vitals-Messungen durchgeführt werden.
- Bundle-Größen oder Asset-Ladezeiten optimiert werden sollen.

## 3. Arbeitsablauf
1. **Frame-Budget-Analyse:**
   - 60 FPS entsprechen einem Frame-Budget von maximal $16.6$ ms ($8.3$ ms für 120 FPS Displays).
   - Budget-Aufteilung:
     - Simulation Tick: $< 3$ ms
     - State Diff & Reactivity: $< 2$ ms
     - Pixi Render / Draw Calls: $< 6$ ms
     - Browser Reflow / Compositing: $< 3$ ms
     - Sicherheitsmarge: $2.6$ ms
2. **Memory Leak Jagd:**
   - Erstelle 3 Heap-Snapshots via Chrome DevTools / Puppeteer:
     1. Baseline nach Kaltstart.
     2. Nach 10 Minuten automatisiertem Spielen / 100 Upgrades.
     3. Nach erzwungener Garbage Collection.
   - Vergleiche Snapshot 3 mit 1: Verbleibende abgetrennte DOM-Knoten (Detached DOM nodes), nicht abgemeldete Event-Listener oder wachsende interne Arrays identifizieren.
3. **Asset- & Bundle-Optimierung:**
   - Prüfe `vite-bundle-visualizer` auf übergroße Abhängigkeiten.
   - Texturen mit WebP / KTX2 komprimieren.
   - Audio mit OGG / AAC bei $96-128$ kbps komprimieren.

## 4. Qualitätskriterien
- **Lighthouse Performance Score:** $\ge 90$ für Desktop und Mobile.
- **Largest Contentful Paint (LCP):** $< 1.8$ Sekunden bei Fast 3G Simulation.
- **Cumulative Layout Shift (CLS):** $< 0.05$ (Kein Springen der Tycoon-UI bei nachladenden Zahlen).
- **Zero Memory Leaks:** Der Speicherverbrauch darf sich nach 1 Stunde kontinuierlichem Spiel um nicht mehr als 15 % über der Baseline einpendeln.

## 5. Typische Fehler (Anti-Patterns)
- **Garbage Collection Thrashing:** Kurzlebige Hilfsobjekte (z.B. `{ x: 0, y: 0 }` Vektoren) in jedem Render-Tick erzeugen, was periodische GC-Pausen von $50-100$ ms provoziert.
- **Layout Thrashing:** Abwechselndes Lesen und Schreiben von DOM-Eigenschaften (`offsetHeight` gefolgt von `style.height = ...`) in Schleifen.
- **Unkomprimierte Roh-Assets:** PNGs mit mehreren Megabytes direkt in das Git-Repository einchecken.

## 6. Prüfschritte
- [ ] Wurde ein 30-minütiger Soak-Test mit Headless-Bot durchgeführt?
- [ ] Bleibt die CPU-Auslastung im Leerlauf (keine Benutzerinteraktion) $< 5$ %?
- [ ] Werden Web-Worker für rechenintensive Background-Berechnungen genutzt?

## 7. Konkrete Projektregeln für REALITY CORP
- Temporäre Vektoren und mathematische Hilfsstrukturen im Tick-Loop müssen über Object Pools wiederverwendet werden.
- Jede neue Third-Party-Bibliothek benötigt eine Begründung und darf die unkomprimierte Bundle-Größe um nicht mehr als 50 KB erhöhen.

