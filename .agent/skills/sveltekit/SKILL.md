---
name: sveltekit
description: "Experten-Skill für SvelteKit und Svelte 5 Entwicklung. Deckt Runes ($state, $derived, $effect, $props), file-based Routing (+page.svelte, +server.ts), SSR/SSG und performante reaktive Komponenten ab."
metadata:
  version: "2.0.0"
  framework: SvelteKit 2 / Svelte 5
  license: MIT
---

# SvelteKit & Svelte 5 Best Practices

## 1. Zweck & Gültigkeit
Dieser Skill liefert praxiserprobte Regeln für die Entwicklung mit SvelteKit und Svelte 5 für Web- und Hybrid-Apps. Er verhindert veraltete Svelte 4 Muster (wie `let` Reaktivität oder imperative Stores, wo Runes überlegen sind).

## 2. Kernrichtlinien für Svelte 5

### 2.1 Reaktivität mit Runes
- Verwende `$state()` für lokalen und geteilten reaktiven Zustand:
  ```svelte
  <script lang="ts">
    let count = $state(0);
    let double = $derived(count * 2);
  </script>
  ```
- Vermeide `$effect()` für Berechnungen. Verwende stattdessen immer `$derived()` oder `$derived.by()`.
- Verwende `$props()` für typisierte Komponenten-Eingaben:
  ```svelte
  <script lang="ts">
    interface Props {
      title: string;
      level?: number;
      onUpgrade?: () => void;
    }
    let { title, level = 1, onUpgrade }: Props = $props();
  </script>
  ```

### 2.2 SvelteKit Routing & Server-Kommunikation
- **Daten laden:** Verwende `+page.server.ts` oder `+page.ts` mit `load`-Funktionen. Niemals clientseitige `fetch`-Orgien im `onMount`.
- **Form Actions:** Bevorzuge `enhance` von `sveltekit:forms` für progressive Formular-Interaktionen ohne Seiten-Reload.
- **API-Endpunkte:** Platziere Backend-Routen in `+server.ts` mit strikter Methoden-Typisierung (`export const POST: RequestHandler = async (...) => ...`).

## 3. Typische Fallstricke & Anti-Patterns
- **Mutation von abgeleitetem Zustand:** Versuche nicht, `$derived`-Werte manuell zuzuweisen.
- **Server-Secrets im Client:** Importiere niemals `$env/static/private` oder `$env/dynamic/private` in Komponenten, die an den Browser gesendet werden.
- **Hydration Mismatch:** Vermeide DOM-Manipulationen im Root-Skript, die sich zwischen SSR und CSR unterscheiden (z.B. direkte Nutzung von `window.innerWidth` ohne Prüfung).

