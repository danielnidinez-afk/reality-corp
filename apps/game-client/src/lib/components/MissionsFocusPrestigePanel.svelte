<script lang="ts">
  import { ActionButton, ProgressBar } from '@reality-corp/ui-components';
  import {
    formatCompactNumber,
    formatCurrency,
    formatDurationCompact
  } from '@reality-corp/ui-components/formatters';
  import type { GameController } from '../state/game-controller.svelte.js';

  let { game }: { game: GameController } = $props();

  const focusPresets = [300, 900, 1500] as const;
</script>

<div class="space-y-6">
  <section class="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-bold uppercase tracking-wider text-cyan-300">
          Deep-Focus-Timer (2.0x Boost)
        </h2>
        <p class="mt-0.5 text-xs text-slate-400">
          Bleibe fokussiert und schalte bis zu 30 Minuten 2x Produktions-Overdrive frei.
        </p>
      </div>
      {#if game.focusEndsAtMs !== null}
        <span class="font-mono text-xl font-bold text-cyan-300">
          {formatDurationCompact(game.focusRemainingSec)}
        </span>
      {/if}
    </div>

    {#if game.focusEndsAtMs !== null}
      <div class="mt-3">
        <ProgressBar
          ratio={1 - game.focusRemainingSec / Math.max(1, game.focusTargetSec)}
          tone="cyan"
          label="Fokus-Timer"
        />
      </div>
    {:else if game.focusReadyToClaim}
      <div class="mt-4">
        <ActionButton variant="accent" fullWidth={true} onclick={() => game.claimFocusBoost()}>
          2.0x Fokus-Boost aktivieren!
        </ActionButton>
      </div>
    {:else}
      <div class="mt-4 grid grid-cols-3 gap-2">
        {#each focusPresets as sec (sec)}
          <ActionButton variant="secondary" onclick={() => game.startFocusTimer(sec)}>
            {sec / 60} Min
          </ActionButton>
        {/each}
      </div>
    {/if}
  </section>

  <section class="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-bold uppercase tracking-wider text-emerald-300">
          IPO / Prestige Soft-Reset
        </h2>
        <p class="mt-1 text-xs text-slate-400">
          Ab {formatCurrency(game.config.prestigeThresholdCash)} Lifetime Earnings erhältst du Equity Shares
          (+{Math.round(game.config.prestigeBonusPerShare * 100)}% Dauerbonus je Share).
        </p>
      </div>
      <div class="text-right font-mono text-xs text-slate-300">
        <div>Aktuell: {formatCompactNumber(game.hud.equityShares, 0)} Shares</div>
        <div class="text-emerald-300">
          Beanspruchbar: +{formatCompactNumber(game.hud.prestigePreview.claimableShares, 0)}
        </div>
      </div>
    </div>

    <div class="mt-4">
      <ActionButton
        variant={game.hud.prestigePreview.canPrestige ? 'accent' : 'secondary'}
        fullWidth={true}
        disabled={!game.hud.prestigePreview.canPrestige}
        onclick={() => game.triggerPrestige()}
      >
        IPO durchführen (+{formatCompactNumber(game.hud.prestigePreview.claimableShares, 0)} Equity Shares)
      </ActionButton>
    </div>
  </section>

  <section>
    <h2 class="text-sm font-bold uppercase tracking-wider text-slate-300">
      Missionen &amp; Tagesziele
    </h2>
    <div class="mt-3 grid gap-3 md:grid-cols-2">
      {#each game.config.missions as mission (mission.id)}
        {@const key = `mission:${mission.id}`}
        {@const claimed = game.hud.claimedRewards.includes(key)}
        {@const satisfied = game.isConditionComplete(mission.condition)}

        <div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <div>
            <h3 class="text-sm font-semibold text-slate-100">{mission.title}</h3>
            <p class="mt-0.5 font-mono text-xs text-slate-400">
              +{formatCurrency(mission.rewardCash)} · +{mission.rewardDataShards} Data
            </p>
          </div>
          {#if claimed}
            <span class="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-emerald-300">
              ERLEDIGT
            </span>
          {:else}
            <ActionButton
              variant={satisfied ? 'accent' : 'secondary'}
              disabled={!satisfied}
              onclick={() => game.claimMission(mission.id, 'mission')}
            >
              Claim
            </ActionButton>
          {/if}
        </div>
      {/each}

      {#each game.hud.dailyChallenges as daily (daily.claimKey)}
        {@const claimed = game.hud.claimedRewards.includes(daily.claimKey)}
        {@const satisfied = game.isConditionComplete(daily.condition)}

        <div class="flex items-center justify-between gap-3 rounded-2xl border border-cyan-900/40 bg-slate-900/75 p-4">
          <div>
            <h3 class="text-sm font-semibold text-cyan-100">{daily.title}</h3>
            <p class="mt-0.5 font-mono text-xs text-slate-400">
              +{formatCurrency(daily.rewardCash)} · +{daily.rewardDataShards} Data
            </p>
          </div>
          {#if claimed}
            <span class="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-emerald-300">
              ERLEDIGT
            </span>
          {:else}
            <ActionButton
              variant={satisfied ? 'primary' : 'secondary'}
              disabled={!satisfied}
              onclick={() => game.claimDailyChallenge(daily)}
            >
              Claim
            </ActionButton>
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>

