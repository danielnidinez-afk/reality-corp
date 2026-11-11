# Git & GitHub Workflow Governance

## 1. Branching-Strategie & Trunk-Safety
- **Main Branch (`main`):** Immer in auslieferbarem, grünem Zustand. Direkte ungetestete Commits auf `main` sind verboten.
- **Feature Branches:** Nomenklatur `feat/<scope>`, `fix/<issue-id>`, `refactor/<module>`, `perf/<scope>`.

## 2. Conventional Commits
Jeder Commit folgt dem Standard:
`type(scope): kurze, prägnante Beschreibung im Imperativ`
Beispiele:
- `feat(economy): implement exponential cost curve for datacenter cooling`
- `fix(savegame): prevent NaN corruption during offline time catchup`
- `test(pixi): add unit test for viewport culling boundaries`

## 3. Pull Request Requirements
- PR-Beschreibung muss Problem, Lösung, betroffene Dateien und Testnachweise enthalten.
- Ein PR darf erst gemerged werden, wenn:
  1. Alle CI-Prüfungen grün sind.
  2. Ein Review durch den zuständigen Specialist-Agenten oder Chief Architect vorliegt.
  3. Keine merge-blockierenden Konflikte vorliegen.
