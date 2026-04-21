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

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const formatCompactCount = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) {
    return '--'
  }

  const absValue = Math.abs(value)
  if (absValue < 1000) {
    return formatInteger(value)
  }

  const units = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' }
  ]

  const unit = units.find((item) => absValue >= item.threshold)
  if (!unit) {
    return formatInteger(value)
  }

  const scaled = value / unit.threshold
  const rounded = Math.round(scaled * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${text}${unit.suffix}`
}

export const formatInteger = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) {
    return '--'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(value)
}
