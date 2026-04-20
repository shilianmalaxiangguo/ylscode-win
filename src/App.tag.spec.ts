import { describe, expect, it } from 'vitest'
import appSource from './App.vue?raw'

describe('App plan tag styles', () => {
  it('keeps the Max tag as a compact pill', () => {
    expect(appSource).toContain('.plan-tag {')
    expect(appSource).toContain('border-radius: 999px;')
    expect(appSource).toContain('padding: 3px 10px;')
    expect(appSource).not.toContain('padding: 6px 10px;')
    expect(appSource).toContain('line-height: 1.2;')
  })
})
