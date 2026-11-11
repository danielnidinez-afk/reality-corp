<script lang="ts">
  import { ProgressBar, StatCard } from '@reality-corp/ui-components';
  import {
    formatCompactNumber,
    formatCurrency,
    formatDurationCompact
  } from '@reality-corp/ui-components/formatters';
  import type { GameController } from '../state/game-controller.svelte.js';

  let { game }: { game: GameController } = $props();

  let energyTone = $derived<'ok' | 'warn' | 'danger'>(
    game.hud.energyLoadFactor >= 0.9 ? 'ok' : game.hud.energyLoadFactor >= 0.65 ? 'warn' : 'danger'
  );
</script>

<header class="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
  <div class="mx-auto max-w-6xl px-3 py-3 sm:px-5">
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="rounded-md bg-cyan-500/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-cyan-300">
            APEX SYNDICATE
          </span>
          {#if game.hud.focusBoostRemainingSec > 0}
            <span class="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
              2x BOOST · {formatDurationCompact(game.hud.focusBoostRemainingSec)}
            </span>
          {/if}
        </div>
        <h1 class="mt-0.5 text-sm font-bold tracking-tight text-slate-100 sm:text-base">
          REALITY CORP — AI INFRASTRUCTURE TYCOON
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={() => game.toggleSound()}
          aria-label={game.soundEnabled ? 'Ton ausschalten' : 'Ton einschalten'}
          class="min-h-12 min-w-12 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          {game.soundEnabled ? 'SFX ON' : 'SFX OFF'}
        </button>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <StatCard
        label="Reality Cash"
        value={formatCurrency(game.hud.cash)}
        subtext="+{formatCurrency(game.hud.cashPerSec)}/s"
        tone="default"
      />
      <StatCard
        label="Data Shards"
        value={formatCompactNumber(game.hud.data)}
        subtext="+{formatCompactNumber(game.hud.dataPerSec)}/s"
        tone="default"
      />
      <StatCard
        label="Compute Grid"
        value="{formatCompactNumber(game.hud.computeFlops)} FLOPS"
        subtext="Equity: {formatCompactNumber(game.hud.equityShares, 0)} Sh."
        tone="default"
      />
      <StatCard
        label="Energie-Netz"
        value="{game.hud.energySupplyKw} / {game.hud.energyDemandKw} kW"
        subtext="Lastfaktor {Math.round(game.hud.energyLoadFactor * 100)}%"
        tone={energyTone}
      />
    </div>

    <div class="mt-2">
      <ProgressBar
        ratio={game.hud.energyLoadFactor}
        tone={energyTone === 'ok' ? 'emerald' : energyTone === 'warn' ? 'amber' : 'rose'}
        label="Netzauslastung"
      />
    </div>
  </div>
</header>

