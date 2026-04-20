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

export const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date)
}
