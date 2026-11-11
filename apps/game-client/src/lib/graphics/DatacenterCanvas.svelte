<script lang="ts">
  import { Application, Graphics } from 'pixi.js';

  interface Props {
    buildingCounts: Record<string, number>;
    energyLoadFactor: number;
    focusActive: boolean;
    tapPulse: number;
  }

  let { buildingCounts, energyLoadFactor, focusActive, tapPulse }: Props = $props();

  let hostEl: HTMLDivElement | undefined = $state();
  let lastInputAtMs = Date.now();
  let pulseIntensity = 0;

  $effect(() => {
    void tapPulse;
    lastInputAtMs = Date.now();
    pulseIntensity = 1;
  });

  $effect(() => {
    if (!hostEl) return;
    const container = hostEl;
    let disposed = false;
    let app: Application | null = null;

    const rackNodes: Graphics[] = [];
    const rackOrder = [
      'garage_server',
      'solar_microgrid',
      'gpu_rack',
      'scraper_array',
      'training_pod',
      'modular_reactor',
      'sovereign_cluster'
    ];

    let coreNode: Graphics | null = null;
    let phase = 0;

    const handlePointer = (): void => {
      lastInputAtMs = Date.now();
      if (app) {
        app.ticker.maxFPS = 60;
      }
    };

    const handleContextLost = (ev: Event): void => {
      ev.preventDefault();
    };

    const bootPixi = async (): Promise<void> => {
      const instance = new Application();
      await instance.init({
        backgroundAlpha: 0,
        resizeTo: container,
        antialias: false,
        powerPreference: 'low-power',
        resolution: Math.min(window.devicePixelRatio || 1, 2)
      });

      if (disposed) {
        instance.destroy(true);
        return;
      }

      app = instance;
      app.ticker.maxFPS = 60;
      container.replaceChildren(instance.canvas);
      instance.canvas.addEventListener('webglcontextlost', handleContextLost);

      coreNode = new Graphics();
      coreNode.circle(0, 0, 26);
      coreNode.fill(0x22d3ee);
      coreNode.stroke({ width: 2, color: 0xa5f3fc });
      instance.stage.addChild(coreNode);

      for (let i = 0; i < rackOrder.length; i += 1) {
        const g = new Graphics();
        g.roundRect(-14, -14, 28, 28, 6);
        g.fill(i === 1 || i === 5 ? 0x10b981 : 0x38bdf8);
        g.stroke({ width: 1.5, color: 0x0f172a });
        instance.stage.addChild(g);
        rackNodes.push(g);
      }

      instance.ticker.add((ticker) => {
        if (document.visibilityState === 'hidden') return;

        const now = Date.now();
        instance.ticker.maxFPS = now - lastInputAtMs > 45_000 ? 30 : 60;

        const dt = ticker.deltaMS / 1000;
        const speedMul = focusActive ? 2.2 : 1.0;
        phase += dt * (0.9 * speedMul);
        pulseIntensity = Math.max(0, pulseIntensity - dt * 3.5);

        const w = instance.screen.width || 320;
        const h = instance.screen.height || 180;
        const cx = w * 0.5;
        const cy = h * 0.5;
        const radius = Math.min(w, h) * 0.34;

        if (coreNode) {
          coreNode.position.set(cx, cy);
          const scale = 1 + pulseIntensity * 0.18 + Math.sin(phase * 2) * 0.04;
          coreNode.scale.set(scale);
          coreNode.tint = energyLoadFactor < 0.85 ? 0xf59e0b : focusActive ? 0x34d399 : 0xffffff;
        }

        for (let i = 0; i < rackNodes.length; i += 1) {
          const node = rackNodes[i];
          const key = rackOrder[i];
          if (!node || !key) continue;
          const level = buildingCounts[key] ?? 0;
          node.visible = level > 0;
          if (!node.visible) continue;

          const angle = phase * 0.4 + (i * Math.PI * 2) / rackNodes.length;
          node.position.set(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.72);
          node.rotation = angle * 0.5;
          const s = 0.85 + Math.min(0.45, Math.log10(level + 1) * 0.25);
          node.scale.set(s);
          node.alpha = 0.55 + energyLoadFactor * 0.45;
        }
      });
    };

    void bootPixi();
    container.addEventListener('pointerdown', handlePointer);

    return () => {
      disposed = true;
      container.removeEventListener('pointerdown', handlePointer);
      if (app) {
        app.canvas.removeEventListener('webglcontextlost', handleContextLost);
        app.destroy(true);
        app = null;
      }
    };
  });
</script>

<div
  bind:this={hostEl}
  class="relative h-44 w-full overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.14),_rgba(2,6,23,0.95))] sm:h-52"
  aria-label="Live Apex Syndicate Datacenter Visualization"
>
  <div class="pointer-events-none absolute top-2.5 left-3 flex items-center gap-2 text-[11px] font-medium text-cyan-300/80">
    <span class="inline-block h-2 w-2 rounded-full {energyLoadFactor < 0.85 ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
    <span>CORE GRID · {Math.round(energyLoadFactor * 100)}% LOAD</span>
  </div>
</div>

