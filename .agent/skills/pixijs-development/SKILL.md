---
name: pixijs-development
description: "Spezialisierter Skill für 2D-Rendering, WebGL/WebGPU-Pipeline, Sprites, Viewport-Culling und Partikelsysteme mit PixiJS in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# PixiJS Rendering & Graphics Engine

## 1. Zweck
Dieser Skill definiert die Richtlinien für die performante 2D-Visualisierung der Spielwelt von *REALITY CORP* (z.B. Datacenter-Server-Racks, KI-Cluster-Netzwerkgraphen, animierte Agenten-Avatare und Datenströme) mit PixiJS (v8+).

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Neue Canvas-Komponenten, WebGL-Szenen oder PixiJS-Container erstellt werden.
- Texturen, Spritesheets oder Atlas-Dateien geladen und verwaltet werden.
- Klick-, Zoom- oder Drag-Interaktionen auf der Spielkarte implementiert werden (Viewport-Management).
- Framerate-Einbrüche, Render-Bottlenecks oder WebGL Context Loss auftreten.

## 3. Arbeitsablauf
1. **Application Lifecycle:**
   - Pixi `Application` immer asynchron initialisieren (`await app.init({ ... })` in Pixi v8).
   - Canvas-Größe dynamisch an den Parent-Container anpassen (Responsive Resizing).
   - Unmount/Cleanup: Beim Verlassen der Komponente explizit `app.destroy(true, { children: true, texture: true })` aufrufen, um WebGL-Memory-Leaks zu verhindern.
2. **Batching & Spritesheets:**
   - Niemals hunderte Einzelbilder laden. Alle Assets in Textur-Atlanten (TexturePacker oder Assetpack) bündeln.
   - Gleiche Blend-Modes und Texturen gruppieren, um Draw Calls $< 25$ pro Frame zu halten.
3. **Culling & Spatial Partitioning:**
   - Objekte außerhalb des sichtbaren Viewports mit `renderable = false` oder `visible = false` vom Rendering ausschließen.
4. **Ticker & Delta Time:**
   - Alle Animationen strikt abhängig von `ticker.deltaTime` machen, um auf 60Hz-, 120Hz- und 144Hz-Displays identische Geschwindigkeit zu garantieren.

## 4. Qualitätskriterien
- **Stabile 60 FPS:** Render-Zeit unter 10 ms pro Frame auf mobilen Mittelklasse-Geräten.
- **Draw Call Budget:** Maximal 30 Draw Calls für die gesamte Weltansicht.
- **Memory Footprint:** Grafikkarten-Speicherverbrauch unter 120 MB VRAM.

## 5. Typische Fehler (Anti-Patterns)
- **Erzeugung von Objekten im Render-Loop:** `new PIXI.Graphics()` oder `new PIXI.Sprite()` innerhalb von `ticker.add(() => ...)` führt zu massiver Garbage Collection und Rucklern.
- **Fehlendes Texture Unloading:** Laden von Texturen ohne Freigabe im Cache (`Assets.unload()`), was auf Mobilgeräten zu OOM-Crashes führt.
- **WebGL Context Lost Ignorieren:** Kein Event-Listener für `webglcontextlost`, wodurch die App nach einem Standby schwarz bleibt.

## 6. Prüfschritte
- [ ] Werden alle Partikel über Partikel-Container oder instanziierte Geometrie gerendert?
- [ ] Bleibt die Framerate bei 500 gleichzeitig animierten Datenpaketen $> 55$ FPS?
- [ ] Werden Touch- und Maus-Events via Pixi `FederatedEvents` sauber gedrosselt?

## 7. Konkrete Projektregeln für REALITY CORP
- Die Pixi-Render-Schicht ist eine reine View-Komponente (Präsentation). Sie hält keinen primären Spielzustand und liest nur aus dem Zustand der Simulation Engine.
- Alle UI-Menüs, Buttons und Dialoge werden bevorzugt mit Svelte/HTML über dem Canvas gerendert; das Canvas dient primär der visuellen Welt- und Agenten-Simulation.

