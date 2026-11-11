<script lang="ts">
  import { BigVal } from '@reality-corp/economy-engine';
  import { ActionButton } from '@reality-corp/ui-components';
  import { formatCompactNumber, formatCurrency } from '@reality-corp/ui-components/formatters';
  import type { BuyQuantity, GameController } from '../state/game-controller.svelte.js';

  let { game }: { game: GameController } = $props();

  const quantities: readonly BuyQuantity[] = [1, 10, 100, 'max'];
  const lazyCanvasPromise = import('../graphics/DatacenterCanvas.svelte');
</script>

<div class="space-y-4">
  {#await lazyCanvasPromise}
    <div class="flex h-44 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-xs text-slate-400 sm:h-52">
      Initialisiere Apex Rechenzentrum...
    </div>
  {:then canvasMod}
    {@const DatacenterCanvas = canvasMod.default}
    <DatacenterCanvas
      buildingCounts={game.hud.buildings}
      energyLoadFactor={game.hud.energyLoadFactor}
      focusActive={game.hud.focusBoostRemainingSec > 0}
      tapPulse={game.tapPulse}
    />
  {/await}

  <ActionButton
    variant="primary"
    fullWidth={true}
    ariaLabel="Compute Cluster manuell takten"
    className="min-h-16 text-base font-bold"
    onclick={() => game.tapCompute()}
  >
    INFERENZ AUSFÜHREN (+{formatCurrency(game.hud.tapCash)})
  </ActionButton>

  <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
    <h2 class="text-sm font-bold uppercase tracking-wider text-slate-300">
      Infrastruktur &amp; Knoten
    </h2>
    <div class="flex items-center gap-1.5" role="group" aria-label="Kaufmenge wählen">
      {#each quantities as qty (qty)}
        <button
          type="button"
          onclick={() => (game.buyQuantity = qty)}
          class="min-h-12 min-w-12 rounded-xl px-3 text-xs font-bold transition-colors {game.buyQuantity === qty
            ? 'bg-cyan-500 text-slate-950'
            : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'}"
        >
          {qty === 'max' ? 'MAX' : `${qty}x`}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid gap-3 md:grid-cols-2">
    {#each game.config.buildings as building (building.id)}
      {@const level = game.hud.buildings[building.id] ?? 0}
      {@const unlocked =
        level > 0 || BigVal.fromSnapshot(game.hud.lifetimeEarnings).gte(building.unlockLifetimeCash)}
      {@const quote = game.getBuildingBuyQuote(building.id)}

      <div class="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
        <div>
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="text-sm font-bold text-slate-100">{building.name}</h3>
              <p class="mt-0.5 text-xs text-slate-400">{building.description}</p>
            </div>
            <span class="rounded-lg bg-slate-800 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300">
              Lv.{level}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
            {#if building.baseCashPerSec > 0}
              <span class="rounded-md bg-slate-800/80 px-2 py-0.5">
                +{formatCurrency(building.baseCashPerSec)}/s Basis
              </span>
            {/if}
            {#if building.baseDataPerSec > 0}
              <span class="rounded-md bg-slate-800/80 px-2 py-0.5">
                +{formatCompactNumber(building.baseDataPerSec)} Data/s
              </span>
            {/if}
            <span
              class="rounded-md px-2 py-0.5 {building.energyKwDelta >= 0
                ? 'bg-emerald-950/60 text-emerald-300'
                : 'bg-amber-950/60 text-amber-300'}"
            >
              {building.energyKwDelta >= 0 ? `+${building.energyKwDelta}` : building.energyKwDelta} kW
            </span>
          </div>
        </div>

        <div class="mt-4">
          {#if !unlocked}
            <div class="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-slate-700 px-3 text-xs text-slate-400">
              Freischaltung ab {formatCurrency(building.unlockLifetimeCash)} Lifetime Revenue
            </div>
          {:else}
            <ActionButton
              variant={quote.affordable ? 'accent' : 'secondary'}
              fullWidth={true}
              disabled={!quote.affordable}
              onclick={() => game.buyBuilding(building.id)}
            >
              +{quote.count} Ausbau · {formatCurrency(quote.cost)}
            </ActionButton>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

