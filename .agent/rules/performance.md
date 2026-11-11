# Performance, Frame-Budget & Memory Governance

## 1. Frame-Budget & Ticker-Disziplin
- Das Spiel muss auf Standardgeräten stabil mit **60 FPS** laufen (maximal $16.6\text{ms}$ Gesamt-Framezeit).
- Framezeit-Aufteilung:
  - Simulation-Tick: $\le 3\text{ms}$
  - State-Reaktivität: $\le 2\text{ms}$
  - Pixi Render & Draw Calls: $\le 6\text{ms}$
  - Browser Compositing / Buffer: $\le 5.6\text{ms}$
- Wenn das Browser-Tab inaktiv ist (`document.hidden`), wird die Ticker-Frequenz auf 1 Hz reduziert und der WebGL-Render-Loop gestoppt.

## 2. Garbage Collection & Memory Management
- **Verbot von Objekt-Allokationen im Render-/Tick-Loop:**
  - Keine `new PIXI.Point()`, `new Vector2()`, oder `{ x, y }` Literale innerhalb von Ticks.
  - Verwende feste Object-Pools oder wiederverwendbare Scratch-Variablen.
- WebGL-Texturen und Spritesheets müssen bei Szenenwechseln über `Assets.unload()` explizit freigegeben werden.
- Speicherverbrauch der Web-Applikation darf im Dauerbetrieb 150 MB Heap nicht überschreiten.

## 3. Bundle-Größe & Core Web Vitals
- Initiales JavaScript-Bundle (gzip/brotli): $\le 350\text{KB}$.
- Largest Contentful Paint (LCP): $\le 1.8\text{s}$.
- Cumulative Layout Shift (CLS): $\le 0.05$.
- Lazy-Loading aller sekundären Screens (Leaderboards, Achievement-Galerie, Sound-Assets) via dynamische `import()`-Aufrufe.
