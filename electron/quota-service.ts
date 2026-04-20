import { mapApiEnvelopeToDashboardSnapshot } from '../shared/mappers.js'
import type { APIEnvelope, DashboardSnapshot } from '../shared/types.js'

const QUOTA_ENDPOINT = 'https://codex.ylsagi.com/codex/info'

export interface QuotaService {
  fetchQuotaSnapshot: (token: string) => Promise<DashboardSnapshot>
}

export interface CreateQuotaServiceOptions {
  fetchImpl?: typeof fetch
}

export const createQuotaService = (options: CreateQuotaServiceOptions = {}): QuotaService => {
  const fetchImpl = options.fetchImpl ?? fetch

  return {
    fetchQuotaSnapshot: async (token: string): Promise<DashboardSnapshot> => {
      const trimmedToken = token.trim()
      if (!trimmedToken) {
        throw new Error('token is required')
      }

      const response = await fetchImpl(QUOTA_ENDPOINT, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`quota fetch failed: ${response.status}`)
      }

      const envelope = (await response.json()) as APIEnvelope
      return mapApiEnvelopeToDashboardSnapshot(envelope, Date.now())
    }
  }
}
