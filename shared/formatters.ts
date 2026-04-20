export const formatUsd = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) {
    return '$--'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value)
}

export const formatPercent = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) {
    return '--'
  }

  return `${value.toFixed(1)}%`
}
