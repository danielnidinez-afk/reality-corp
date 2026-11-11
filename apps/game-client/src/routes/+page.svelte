<script lang="ts">
  import { onMount } from 'svelte';
  import MissionsFocusPrestigePanel from '../lib/components/MissionsFocusPrestigePanel.svelte';
  import OfflineWelcomeModal from '../lib/components/OfflineWelcomeModal.svelte';
  import OperationsPanel from '../lib/components/OperationsPanel.svelte';
  import ResearchAndManagersPanel from '../lib/components/ResearchAndManagersPanel.svelte';
  import TopHud from '../lib/components/TopHud.svelte';
  import WorldsPanel from '../lib/components/WorldsPanel.svelte';
  import { GameController, type GameTab } from '../lib/state/game-controller.svelte.js';

  const game = new GameController();

  const navItems: ReadonlyArray<{ id: GameTab; label: string }> = [
    { id: 'ops', label: 'Cluster' },
    { id: 'rnd', label: 'R&D / AI' },
    { id: 'missions', label: 'Focus & IPO' },
    { id: 'worlds', label: 'Welten' }
  ];

  onMount(() => {
    void game.init();
    return () => game.destroy();
  });
</script>

<div class="min-h-screen bg-slate-950 pb-24 text-slate-100 md:pb-8">
  <TopHud {game} />

  <main class="mx-auto max-w-6xl px-3 pt-4 sm:px-5">
    {#if game.statusBanner}
      <div class="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-950/35 px-4 py-3 text-xs text-cyan-200">
        <span>{game.statusBanner}</span>
        <button
          type="button"
          class="min-h-12 min-w-12 px-2 font-bold text-cyan-300"
          onclick={() => (game.statusBanner = null)}
        >
          OK
        </button>
      </div>
    {/if}

    <div class="md:grid md:grid-cols-[200px_1fr] md:gap-5">
      <nav class="hidden space-y-2 md:block" aria-label="Desktop Navigation">
        {#each navItems as item (item.id)}
          <button
            type="button"
            onclick={() => (game.activeTab = item.id)}
            class="flex min-h-12 w-full items-center rounded-2xl px-4 text-left text-sm font-semibold transition-colors {game.activeTab === item.id
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800'}"
          >
            {item.label}
          </button>
        {/each}
      </nav>

      <section aria-live="polite">
        {#if game.activeTab === 'ops'}
          <OperationsPanel {game} />
        {:else if game.activeTab === 'rnd'}
          <ResearchAndManagersPanel {game} />
        {:else if game.activeTab === 'missions'}
          <MissionsFocusPrestigePanel {game} />
        {:else}
          <WorldsPanel {game} />
        {/if}
      </section>
    </div>
  </main>

  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur-md md:hidden"
    aria-label="Mobile Thumb Navigation"
  >
    <div class="mx-auto grid max-w-md grid-cols-4 gap-1.5">
      {#each navItems as item (item.id)}
        <button
          type="button"
          onclick={() => (game.activeTab = item.id)}
          class="min-h-12 rounded-xl px-2 text-xs font-bold transition-colors {game.activeTab === item.id
            ? 'bg-cyan-500 text-slate-950'
            : 'bg-slate-900 text-slate-300'}"
        >
          {item.label}
        </button>
      {/each}
    </div>
  </nav>

  <OfflineWelcomeModal {game} />
</div>

