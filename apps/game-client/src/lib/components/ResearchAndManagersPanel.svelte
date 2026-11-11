<script lang="ts">
  import { BigVal } from '@reality-corp/economy-engine';
  import { ActionButton } from '@reality-corp/ui-components';
  import { formatCompactNumber, formatCurrency } from '@reality-corp/ui-components/formatters';
  import type { GameController } from '../state/game-controller.svelte.js';

  let { game }: { game: GameController } = $props();
</script>

<div class="space-y-6">
  <section>
    <h2 class="text-sm font-bold uppercase tracking-wider text-slate-300">
      Forschungsbaum (Data Shards)
    </h2>
    <div class="mt-3 grid gap-3 md:grid-cols-2">
      {#each game.config.research as node (node.id)}
        {@const unlocked = game.hud.unlockedResearch.includes(node.id)}
        {@const ready = game.isResearchReady(node.id)}

        <div class="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-sm font-bold text-slate-100">{node.name}</h3>
              <span class="rounded-lg bg-slate-800 px-2 py-0.5 font-mono text-xs text-cyan-300">
                {formatCompactNumber(node.costDataShards, 0)} Data
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-400">{node.description}</p>
            {#if node.prerequisites.length > 0}
              <p class="mt-2 text-[11px] text-slate-500">
                Voraussetzung: {node.prerequisites.join(', ')}
              </p>
            {/if}
          </div>

          <div class="mt-4">
            {#if unlocked}
              <div class="flex min-h-12 items-center justify-center rounded-xl bg-emerald-950/50 text-xs font-bold text-emerald-300">
                ERFORSCHT
              </div>
            {:else}
              <ActionButton
                variant={ready ? 'primary' : 'secondary'}
                fullWidth={true}
                disabled={!ready}
                onclick={() => game.unlockResearch(node.id)}
              >
                Freischalten ({formatCompactNumber(node.costDataShards, 0)} Data)
              </ActionButton>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2 class="text-sm font-bold uppercase tracking-wider text-slate-300">
      AI-Operations-Manager
    </h2>
    <div class="mt-3 grid gap-3 md:grid-cols-3">
      {#each game.config.managers as mgr (mgr.id)}
        {@const hired = game.hud.hiredManagers.includes(mgr.id)}
        {@const active = game.hud.managerActive[mgr.id] ?? true}
        {@const canAfford = BigVal.fromSnapshot(game.hud.cash).gte(mgr.hireCostCash)}

        <div class="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <div>
            <h3 class="text-sm font-bold text-slate-100">{mgr.name}</h3>
            <p class="mt-1 text-xs text-slate-400">
              Automatisiert: {mgr.targetBuildingId} · Alle {mgr.cooldownSec}s
            </p>
          </div>
          <div class="mt-4">
            {#if hired}
              <ActionButton
                variant={active ? 'accent' : 'secondary'}
                fullWidth={true}
                onclick={() => game.toggleManager(mgr.id)}
              >
                {active ? 'Auto-Upgrade: AKTIV' : 'Auto-Upgrade: PAUSIERT'}
              </ActionButton>
            {:else}
              <ActionButton
                variant={canAfford ? 'primary' : 'secondary'}
                fullWidth={true}
                disabled={!canAfford}
                onclick={() => game.hireManager(mgr.id)}
              >
                Einstellen · {formatCurrency(mgr.hireCostCash)}
              </ActionButton>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

