<script lang="ts">
  import { clampPercentage } from './formatters.js';

  interface Props {
    ratio: number;
    tone?: 'cyan' | 'emerald' | 'amber' | 'rose';
    label?: string;
  }

  let { ratio, tone = 'cyan', label }: Props = $props();

  let pct = $derived(clampPercentage(ratio));

  const barColors: Record<'cyan' | 'emerald' | 'amber' | 'rose', string> = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-500'
  };
</script>

<div class="w-full" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Fortschritt'}>
  <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
    <div
      class="h-full origin-left rounded-full transition-transform duration-150 ease-out {barColors[tone]}"
      style="transform: scaleX({pct / 100});"
    ></div>
  </div>
</div>

