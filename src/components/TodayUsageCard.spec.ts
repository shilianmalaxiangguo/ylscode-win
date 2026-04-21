import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodayUsageCard from './TodayUsageCard.vue'
import todayUsageCardSource from './TodayUsageCard.vue?raw'

describe('TodayUsageCard', () => {
  it('renders a compact two-row token summary', () => {
    const wrapper = mount(TodayUsageCard, {
      props: {
        usage: {
          totalTokens: 6206542,
          requestCount: 128,
          inputTokens: 3214567,
          cachedInputTokens: 2987654
        }
      }
    })

    const labels = wrapper.findAll('.metric-label').map((node) => node.text())
    const values = wrapper.findAll('.metric-value').map((node) => node.text())

    expect(labels).toEqual(['总 Token', '请求次数', '输入 Token', '缓存 Token'])
    expect(values).toEqual(['6.2M', '128', '3.2M', '3M'])
    expect(todayUsageCardSource).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(todayUsageCardSource).not.toContain('grid-template-columns: 1fr;')
    expect(todayUsageCardSource).not.toContain('输出 Token')
  })
})
