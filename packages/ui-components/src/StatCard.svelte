<script lang="ts">
  interface Props {
    label: string;
    value: string;
    subtext?: string;
    tone?: 'default' | 'ok' | 'warn' | 'danger';
  }

  let { label, value, subtext = '', tone = 'default' }: Props = $props();

  const toneClasses: Record<'default' | 'ok' | 'warn' | 'danger', string> = {
    default: 'border-slate-800 bg-slate-900/80 text-slate-100',
    ok: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300',
    warn: 'border-amber-500/40 bg-amber-950/35 text-amber-300',
    danger: 'border-rose-500/50 bg-rose-950/40 text-rose-300'
  };
</script>

<div class="rounded-2xl border p-3.5 backdrop-blur-sm {toneClasses[tone]}">
  <div class="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
  <div class="mt-1 font-mono text-lg font-bold tabular-nums">{value}</div>
  {#if subtext}
    <div class="mt-0.5 text-xs text-slate-400">{subtext}</div>
  {/if}
</div>

