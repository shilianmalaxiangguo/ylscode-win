import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountApp } from './main'

describe('App shell bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('mounts through main entry and renders the empty state copy', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mountApp('#app')
    await Promise.resolve()

    const text = document.body.textContent ?? ''
    expect(text).toContain('YLS Code')
    expect(text).toContain('剩余额度 (USD)')
    expect(text).toContain('请先配置 Token')

    const logs = [...warnSpy.mock.calls, ...errorSpy.mock.calls].flat().join(' ')
    expect(logs).not.toContain('Failed to resolve component: UApp')
  })
})
