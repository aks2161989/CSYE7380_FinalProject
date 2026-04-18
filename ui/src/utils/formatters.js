export function formatCurrency(value) {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value, decimals = 2) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(value, decimals = 2) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}
