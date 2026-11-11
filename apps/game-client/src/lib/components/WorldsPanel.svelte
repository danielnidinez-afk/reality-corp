<script lang="ts">
  import { ActionButton } from '@reality-corp/ui-components';
  import type { GameController } from '../state/game-controller.svelte.js';

  let { game }: { game: GameController } = $props();
</script>

<div class="space-y-4">
  <h2 class="text-sm font-bold uppercase tracking-wider text-slate-300">
    Welten &amp; Systemverwaltung
  </h2>

  <div class="grid gap-3 md:grid-cols-3">
    {#each game.worlds as world (world.worldId)}
      <div class="flex flex-col justify-between rounded-2xl border p-4 {world.isPlayableInMvp
        ? 'border-cyan-500/40 bg-slate-900/85'
        : 'border-slate-800 bg-slate-950/80 opacity-80'}">
        <div>
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-bold text-slate-100">{world.displayName}</h3>
            <span class="rounded-lg px-2 py-0.5 text-[11px] font-bold {world.isPlayableInMvp
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-slate-800 text-slate-400'}">
              {world.isPlayableInMvp ? 'MVP AKTIV' : 'LOCKED'}
            </span>
          </div>
          <p class="mt-2 text-xs text-slate-400">
            {world.isPlayableInMvp
              ? 'Skalierung von der Garage zum Sovereign Mega-Cluster.'
              : 'Vorbereitet im Backend & Config-Katalog (Phase 2/3 Expansion).'}
          </p>
        </div>

        <div class="mt-4">
          <ActionButton
            variant={world.isPlayableInMvp ? 'primary' : 'secondary'}
            fullWidth={true}
            onclick={() => game.selectWorld(world.worldId)}
          >
            {world.isPlayableInMvp ? 'Aktiv in Apex Syndicate' : 'Vorschau gesperrt'}
          </ActionButton>
        </div>
      </div>
    {/each}
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
    <div>
      <h3 class="text-sm font-semibold text-slate-200">Lokaler Offline-Speicher (IndexedDB .bak)</h3>
      <p class="text-xs text-slate-400">Spielstand wird verschlüsselt mit FNV-1a-Prüfsumme lokal gesichert.</p>
    </div>
    <div class="flex gap-2">
      <ActionButton variant="secondary" onclick={() => void game.persistNow()}>
        Jetzt sichern
      </ActionButton>
      <ActionButton variant="danger" onclick={() => void game.resetLocalProgress()}>
        Reset
      </ActionButton>
    </div>
  </div>
</div>

