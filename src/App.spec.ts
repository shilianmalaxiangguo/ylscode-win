import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

describe('App shell', () => {
  it('shows empty state copy', () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('YLS Code')
    expect(wrapper.text()).toContain('剩余额度 (USD)')
    expect(wrapper.text()).toContain('请先配置 Token')
  })
})
