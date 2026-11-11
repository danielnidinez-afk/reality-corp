<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'accent' | 'danger';
    disabled?: boolean;
    fullWidth?: boolean;
    ariaLabel?: string;
    className?: string;
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    disabled = false,
    fullWidth = false,
    ariaLabel,
    className = '',
    onclick,
    children
  }: Props = $props();

  const variantClasses: Record<'primary' | 'secondary' | 'accent' | 'danger', string> = {
    primary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-[0.98] shadow-lg shadow-cyan-500/20',
    secondary: 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 active:scale-[0.98]',
    accent: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.98] shadow-lg shadow-emerald-500/20',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98]'
  };
</script>

<button
  type="button"
  {disabled}
  aria-label={ariaLabel}
  {onclick}
  class="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-45 {fullWidth ? 'w-full' : ''} {variantClasses[variant]} {className}"
>
  {@render children()}
</button>

