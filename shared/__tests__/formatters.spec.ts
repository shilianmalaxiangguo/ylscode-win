import { describe, expect, it } from 'vitest'
import {
  formatCompactCount,
  formatDate,
  formatInteger,
  formatPercent,
  formatUsd
} from '../formatters'

describe('formatUsd', () => {
  it('formats integer USD without decimals', () => {
    expect(formatUsd(12340)).toBe('$12,340')
  })

  it('formats decimal USD with two decimals', () => {
    expect(formatUsd(12340.5)).toBe('$12,340.50')
  })

  it('returns placeholder for nullish values', () => {
    expect(formatUsd(null)).toBe('$--')
    expect(formatUsd(undefined)).toBe('$--')
  })
})

describe('formatPercent', () => {
  it('formats ratio percent with one decimal place', () => {
    expect(formatPercent(38.27)).toBe('38.3%')
  })

  it('returns placeholder for nullish values', () => {
    expect(formatPercent(null)).toBe('--')
    expect(formatPercent(undefined)).toBe('--')
  })
})

describe('formatDate', () => {
  it('formats ISO date in UTC timestamp text', () => {
    expect(formatDate('2099-01-01T20:00:00.000Z')).toBe('2099-01-01 20:00:00')
  })

  it('returns placeholder for invalid values', () => {
    expect(formatDate(null)).toBe('--')
    expect(formatDate(undefined)).toBe('--')
    expect(formatDate('bad-date')).toBe('--')
  })
})

describe('formatCompactCount', () => {
  it('formats token counts using compact K and M notation', () => {
    expect(formatCompactCount(54321)).toBe('54.3K')
    expect(formatCompactCount(3214567)).toBe('3.2M')
    expect(formatCompactCount(2987654)).toBe('3M')
  })

  it('returns placeholder for invalid values', () => {
    expect(formatCompactCount(null)).toBe('--')
    expect(formatCompactCount(undefined)).toBe('--')
    expect(formatCompactCount(Number.NaN)).toBe('--')
  })
})

describe('formatInteger', () => {
  it('formats integers with separators', () => {
    expect(formatInteger(2085)).toBe('2,085')
  })

  it('returns placeholder for invalid values', () => {
    expect(formatInteger(null)).toBe('--')
    expect(formatInteger(undefined)).toBe('--')
    expect(formatInteger(Number.NaN)).toBe('--')
  })
})
