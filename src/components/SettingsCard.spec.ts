import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ui from '@nuxt/ui/vue-plugin'
import SettingsCard from './SettingsCard.vue'
import settingsCardSource from './SettingsCard.vue?raw'

describe('SettingsCard layout contract', () => {
  it('uses one shared control sizing contract for the polling row', () => {
    const wrapper = mount(SettingsCard, {
      global: {
        plugins: [ui]
      },
      props: {
        token: 'existing-token',
        pollingMs: 60000,
        intervalOptions: [5000, 30000, 60000]
      }
    })

    expect(wrapper.get('#polling-select').classes()).toContain('field-control')
    expect(wrapper.get('.save-button').classes()).toContain('field-control')
    expect(settingsCardSource).toContain('--field-control-height: 46px;')
    expect(settingsCardSource).toContain('.field-control {')
    expect(settingsCardSource).toContain('box-sizing: border-box;')
    expect((settingsCardSource.match(/var\(--field-control-height\)/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })
})
