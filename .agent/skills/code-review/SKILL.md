---
name: code-review
description: "Spezialisierter Skill für statische Code-Analyse, PR-Reviews, Architektur-Konformität, Typsicherheit und Best-Practice-Prüfung in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Code Review & Architecture Quality Gate

## 1. Zweck
Dieser Skill definiert die Kriterien und Vorgehensweisen für automatisierte und manuelle Code-Reviews. Er stellt sicher, dass kein fehlerhafter, ungetesteter oder architekturwidriger Code in den Hauptzweig von *REALITY CORP* gelangt.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Ein Pull Request (PR) oder Git-Commit vor dem Merge geprüft werden soll.
- Refactorings durchgeführt oder vorgeschlagen werden.
- Code-Qualitätsmetriken, Linter-Warnungen oder technische Schulden evaluiert werden.
- Eine zweite Meinung zur Lesbarkeit, Wartbarkeit oder Sicherheit eingeholt wird.

## 3. Arbeitsablauf
1. **Scope & Diff Analyse:**
   - Untersuche den Diff (`git diff` oder PR-Payload).
   - Prüfe: Wurde nur geändert, was für die Aufgabe notwendig war (Minimal Change Principle)?
   - Wurden unerwünschte Formatierungs-Kaskaden oder versehentlich gelöschte Kommentare erzeugt?
2. **Architektur- & Schichten-Check:**
   - Bleibt die Simulation frei von DOM-Abhängigkeiten?
   - Werden Typen und Interfaces im gemeinsamen Typenverzeichnis gepflegt?
   - Werden Third-Party-Bibliotheken hinter sauberen Schnittstellen gekapselt?
3. **Korrektheit & Edge Cases:**
   - Null- & Undefined-Checks: Gibt es ungesicherte Zugriffe (`obj!.prop` oder `arr[0]`)?
   - Exception Handling: Werden Fehler geschluckt (`catch (e) {}`) oder sauber transformiert und gemeldet?
   - Race Conditions: Werden asynchrone Promises geordnet abgewickelt?
4. **Performance & Memory:**
   - Werden Event-Listener und Subscriptions beim Unmount abgemeldet?
   - Gibt es unnötige Speicher-Allokationen in Rendering- oder Simulations-Ticks?
5. **Erstellung des Review-Feedbacks:**
   - Feedback in 3 Kategorien einteilen:
     - `BLOCKER`: Kritische Fehler, Sicherheitslücken, Datenverlust-Risiko (muss vor Merge behoben werden).
     - `WARNUNG`: Performance-Probleme, fehlende Tests, Design-Schwächen.
     - `NITPICK`: Kleinere Lesbarkeits- oder Benennungsvorschläge (optional).

## 4. Qualitätskriterien
- **Actionable Feedback:** Jede Kritik muss eine konkrete, funktionierende Code-Alternative enthalten.
- **Objektivität:** Kritik basiert auf Performance-Daten, Sicherheitsregeln oder Typsicherheit, nicht auf persönlichem Geschmack.
- **Test-Abdeckung:** Keine neue Spiellogik ohne begleitende Unit- oder Integrationstests.

## 5. Typische Fehler (Anti-Patterns)
- **Rubber-Stamping:** Blindes Freigeben von Code ohne Prüfung von Randwerten und Memory Leaks.
- **Scope Creep im PR:** Ein PR für einen einfachen UI-Bugfix refaktoriert plötzlich die gesamte Datenbank-Anbindung.
- **Any-Casting:** Verwendung von `as any` in TypeScript, um Compiler-Fehler oberflächlich zu unterdrücken.

## 6. Prüfschritte
- [ ] Laufen alle Linter (`eslint`, `biome`) und der Typ-Check (`tsc --noEmit`) fehlerfrei durch?
- [ ] Werden alle neuen öffentlichen Methoden mit klaren TSDoc-Kommentaren versehen?
- [ ] Sind keine sensiblen Testdaten oder Passwörter im Commit enthalten?

## 7. Konkrete Projektregeln für REALITY CORP
- Kein Commit auf `main` ohne erfolgreichen Durchlauf der Test-Suite.
- Die Verwendung von `any` ist im gesamten Projekt verboten (`unknown` mit Typ-Guards nutzen).
- Jeder Blocker erfordert einen direkten Korrektur-Commit vor Fortführung weiterer Arbeiten.

