import { describe, expect, it } from 'vitest'
import { formatPercent, formatUsd } from '../formatters'

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
