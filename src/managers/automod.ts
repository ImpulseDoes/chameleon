import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildAutoModRule } from '../builders/index.js'
import type { AutoModerationRule } from '../types/automod/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'

export class AutoModerationManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  async list(guildId: string): Promise<ChameleonAPIResult<AutoModerationRule[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/auto-moderation/rules`)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const rules = (result.data as Record<string, unknown>[]).map(r => {
      
      const rule = buildAutoModRule(r)
      
      this.store.autoModRules.set(rule.id, rule)
      
      return rule
    })

    return { ok: true, data: rules }
  }

  async fetch(guildId: string, ruleId: string): Promise<ChameleonAPIResult<AutoModerationRule>> {

    const cached = this.store.autoModRules.get(ruleId)
    if (cached) return { ok: true, data: cached }

    const result = await this.rest.get<unknown>(`/guilds/${guildId}/auto-moderation/rules/${ruleId}`)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const rule = buildAutoModRule(result.data as Record<string, unknown>)
    
    this.store.autoModRules.set(rule.id, rule)
    return { ok: true, data: rule }
  }

  async create(guildId: string, payload: Partial<AutoModerationRule>, reason?: string): Promise<ChameleonAPIResult<AutoModerationRule>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/auto-moderation/rules`, toSnakeCase(payload), headers)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const rule = buildAutoModRule(result.data as Record<string, unknown>)
    this.store.autoModRules.set(rule.id, rule)
    
    return { ok: true, data: rule }
  }

  async edit(guildId: string, ruleId: string, payload: Partial<AutoModerationRule>, reason?: string): Promise<ChameleonAPIResult<AutoModerationRule>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.patch<unknown>(`/guilds/${guildId}/auto-moderation/rules/${ruleId}`, toSnakeCase(payload), headers)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const rule = buildAutoModRule(result.data as Record<string, unknown>)
    this.store.autoModRules.set(rule.id, rule)
    
    return { ok: true, data: rule }
  }

  async delete(guildId: string, ruleId: string, reason?: string): Promise<ChameleonAPIResult<void>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.delete(`/guilds/${guildId}/auto-moderation/rules/${ruleId}`, headers)
    
    if (result.ok) this.store.autoModRules.delete(ruleId)
    
    return result as ChameleonAPIResult<void>
  }
}