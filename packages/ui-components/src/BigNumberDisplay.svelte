<script lang="ts">
  import type { BigValInput } from '@reality-corp/economy-engine';
  import { formatCompactNumber, formatCurrency } from './formatters.js';

  interface Props {
    value: BigValInput;
    currency?: boolean;
    decimals?: number;
    suffix?: string;
    className?: string;
  }

  let { value, currency = false, decimals = 2, suffix = '', className = '' }: Props = $props();

  let formatted = $derived(
    (currency ? formatCurrency(value, decimals) : formatCompactNumber(value, decimals)) + suffix
  );
</script>

<span class="font-mono tabular-nums tracking-tight {className}">
  {formatted}
</span>

