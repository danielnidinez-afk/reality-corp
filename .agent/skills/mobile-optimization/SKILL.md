---
name: mobile-optimization
description: "Spezialisierter Skill für Mobile-First UX, Touch-Ergonomie, Akku- und Speicherschonung sowie Capacitor-Packaging in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Mobile Performance & Capacitor Optimization

## 1. Zweck
Dieser Skill stellt sicher, dass *REALITY CORP* auf Mobilgeräten (iOS & Android via Capacitor/Web) extrem schnell, reaktionsfreudig und akkuschonend läuft, ohne das Gerät zu überhitzen oder den RAM zu überlasten.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Touch-Gesten, Wisch-Navigation oder Mobile Safe Areas (Notch, Dynamic Island, Home Indicator) eingerichtet werden.
- Capacitor-Plugins für Haptics, Local Notifications, Offline-Storage oder App-Lifecycle angebunden werden.
- Thermische Drosselung (Thermal Throttling) oder hoher Akkuverbrauch gemeldet werden.
- Layouts für Portrait- und Landscape-Modi auf Smartphones und Tablets optimiert werden.

## 3. Arbeitsablauf
1. **Viewport & Safe Area Setup:**
   - Setze Viewport-Meta-Tag mit `viewport-fit=cover`.
   - Verwende CSS-Variablen `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, etc.
   - Deaktiviere unerwünschte Standard-Gesten (`touch-action: manipulation`, `-webkit-touch-callout: none`).
2. **Touch-Target-Ergonomie:**
   - Jeder interaktive Button muss eine Mindest-Touchfläche von $44 \times 44$ pt ($48 \times 48$ px auf Android) aufweisen.
   - Daumen-Erreichbarkeit (Thumb Zone) beachten: Primäre Klick-Aktionen und Navigation am unteren Bildschirmrand platzieren.
3. **Akku- & Thermal-Management:**
   - Wenn der Spieler 30 Sekunden lang keine Eingabe tätigt, drossle die Render-Framerate von 60 FPS auf 30 FPS.
   - Wenn das Fenster im Hintergrund ist, stoppe WebGL-Rendering komplett.
4. **Haptic Feedback:**
   - Nutze dezentes, präzises haptisches Feedback via `@capacitor/haptics` für wichtige Meilensteine (Upgrade-Kauf, Prestige-Unlock), aber spamme Haptik nicht bei schnellem Dauerklicken.

## 4. Qualitätskriterien
- **Initial Bundle Size:** Das komprimierte initiale JavaScript-Bundle muss $< 500$ KB betragen (Code-Splitting via dynamische Imports).
- **RAM-Limit:** Gesamt-Speicherverbrauch der WebView $< 180$ MB auf älteren Geräten.
- **Keine Jank-Spikes:** 99.5 % aller Touch-Events müssen innerhalb von 16 ms visuelles Feedback liefern.

## 5. Typische Fehler (Anti-Patterns)
- **Fehlende Safe-Area-Paddings:** UI-Elemente werden unter der Kamera-Notch oder dem iOS-Home-Balken abgeschnitten und unbedienbar.
- **Unnötiger Dauer-Polling:** Endlose HTTP-Anfragen im Sekundentakt saugen den Smartphone-Akku in Rekordzeit leer.
- **Doppelklick-Zoom:** Fehlendes `user-scalable=no` oder unpassende `touch-action`, wodurch versehentliche Zooms das Spiellayout zerstören.

## 6. Prüfschritte
- [ ] Wurde das Layout auf Bildschirmen von 360px Breite bis Tablet-Auflösungen validiert?
- [ ] Funktioniert die App nahtlos nach Unterbrechung durch eingehende Anrufe oder App-Wechsel?
- [ ] Werden Sounds und Haptik stummgeschaltet, wenn das Gerät im Silent-Mode ist?

## 7. Konkrete Projektregeln für REALITY CORP
- Alle interaktiven Komponenten müssen für Touch und Maus gleichermaßen optimiert sein.
- Große Audio-Dateien (Soundtrack) erst on-demand nach der ersten Benutzerinteraktion nachladen.
- Offline-First: Keine Netzwerk-Blocker im Hauptmenü.

