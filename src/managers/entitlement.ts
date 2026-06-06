import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildEntitlement } from '../builders/index.js'
import type { Entitlement } from '../types/entitlement/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'

export class EntitlementManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  async list(applicationId: string, options?: { userId?: string, skuIds?: string[], before?: string, after?: string, limit?: number, guildId?: string, excludeEnded?: boolean }): Promise<ChameleonAPIResult<Entitlement[]>> {
    
    let url = `/applications/${applicationId}/entitlements`

    if (options) {
      
      const params = new URLSearchParams()
      
      if (options.userId) params.append('user_id', options.userId)
      if (options.skuIds) params.append('sku_ids', options.skuIds.join(','))
      if (options.before) params.append('before', options.before)
      if (options.after) params.append('after', options.after)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.guildId) params.append('guild_id', options.guildId)
      if (options.excludeEnded) params.append('exclude_ended', 'true')
      
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown[]>(url)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const entitlements = (result.data as Record<string, unknown>[]).map(e => buildEntitlement(e))

    return { ok: true, data: entitlements }
  }

  async fetch(applicationId: string, entitlementId: string): Promise<ChameleonAPIResult<Entitlement>> {

    const result = await this.rest.get<unknown>(`/applications/${applicationId}/entitlements/${entitlementId}`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: buildEntitlement(result.data as Record<string, unknown>) }
  }

  async createTest(applicationId: string, payload: { skuId: string, ownerId: string, ownerType: number }): Promise<ChameleonAPIResult<Entitlement>> {
    
    const result = await this.rest.post<unknown>(`/applications/${applicationId}/entitlements`, toSnakeCase(payload))
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: buildEntitlement(result.data as Record<string, unknown>) }
  }

  async deleteTest(applicationId: string, entitlementId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.delete(`/applications/${applicationId}/entitlements/${entitlementId}`)
    
    return result as ChameleonAPIResult<void>
  }
}