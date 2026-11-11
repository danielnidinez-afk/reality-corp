<script lang="ts">
  import { ActionButton } from '@reality-corp/ui-components';
  import {
    formatCompactNumber,
    formatCurrency,
    formatDurationCompact
  } from '@reality-corp/ui-components/formatters';
  import type { GameController } from '../state/game-controller.svelte.js';

  let { game }: { game: GameController } = $props();
</script>

{#if game.offlineModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="offline-title"
  >
    <div class="w-full max-w-md rounded-3xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl">
      <h2 id="offline-title" class="text-lg font-bold text-slate-100">
        Willkommen zurück, Founder
      </h2>
      <p class="mt-1 text-xs text-slate-400">
        Deine Systeme arbeiteten {formatDurationCompact(game.offlineModal.elapsedSec)} im Offline-Betrieb weiter.
      </p>

      {#if game.offlineModal.recoveredFromBackup}
        <p class="mt-3 rounded-xl bg-amber-950/50 p-2.5 text-xs text-amber-200">
          Hinweis: Primärspeicher wurde automatisch aus dem .bak-Backup wiederhergestellt.
        </p>
      {/if}

      <div class="mt-4 space-y-2 rounded-2xl bg-slate-950/80 p-4 font-mono text-sm">
        <div class="flex justify-between">
          <span class="text-slate-400">Reality Cash:</span>
          <span class="font-bold text-emerald-300">+{formatCurrency(game.offlineModal.cashEarned)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Data Shards:</span>
          <span class="font-bold text-cyan-300">+{formatCompactNumber(game.offlineModal.dataEarned)}</span>
        </div>
      </div>

      <div class="mt-5">
        <ActionButton variant="primary" fullWidth={true} onclick={() => game.dismissOfflineModal()}>
          Ertrag verbuchen
        </ActionButton>
      </div>
    </div>
  </div>
{/if}

