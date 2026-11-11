# Mobile Optimization & Capacitor Governance

## 1. Touch-Ergonomie & Layout-Zonen
- **Mindest-Klickfläche:** Alle Buttons und interaktiven Steuerelemente müssen eine physische Mindestgröße von $48 \times 48\text{px}$ aufweisen.
- **Thumb-Zone Priorisierung:** Häufig betätigte Bedienelemente (z.B. Clicker-Flächen, primäre Upgrade-Kaufbuttons) liegen im unteren Bildschirmdrittel.
- **Safe Area Insets:** Pflichtgemäße Einbindung von `env(safe-area-inset-top)` und `env(safe-area-inset-bottom)` gegen Überdeckung durch Notches oder Home-Indikatoren.

## 2. Haptik & Akku-Schonung
- Haptisches Feedback via `@capacitor/haptics` sparsam und taktvoll einsetzen (nur bei Meilensteinen, Level-Ups oder Prestige-Events).
- **Thermal Throttling Protection:** Sinkt der Akkustand oder tritt Inaktivität ein (> 45s ohne Touch-Event), wird die Framerate auf 30 FPS gedrosselt.

## 3. Native Bridge & Offline-Fähigkeit
- Native Capacitor-Plugins dürfen nur nach Prüfung von `Capacitor.isNativePlatform()` aufgerufen werden.
- Die App muss ohne Internetverbindung im vollen Funktionsumfang lokal spielbar sein (Lokales Auto-Save in IndexedDB).

