import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildAutoModRule } from '../builders/index.js'
import type { AutoModerationRule } from '../types/automod/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class AutoModerationManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  private _cacheRule(raw: Record<string, unknown>): AutoModerationRule {

    const rule = buildAutoModRule(raw)
    this.store.autoModRules.set(rule.id, rule)
    
    return rule
  }

  async list(guildId: string): Promise<ChameleonAPIResult<AutoModerationRule[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/auto-moderation/rules`)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const rules = (result.data as Record<string, unknown>[]).map(rule => this._cacheRule(rule))

    return { ok: true, data: rules }
  }

  async fetch(guildId: string, ruleId: string): Promise<ChameleonAPIResult<AutoModerationRule>> {

    const cached = this.store.autoModRules.get(ruleId)
    if (cached) return { ok: true, data: cached }

    const result = await this.rest.get<unknown>(`/guilds/${guildId}/auto-moderation/rules/${ruleId}`)
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: this._cacheRule(result.data as Record<string, unknown>) }
  }

  async create(guildId: string, payload: Partial<AutoModerationRule>, reason?: string): Promise<ChameleonAPIResult<AutoModerationRule>> {

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/auto-moderation/rules`, toSnakeCase(payload), createAuditLogHeaders(reason))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._cacheRule(result.data as Record<string, unknown>) }
  }

  async edit(guildId: string, ruleId: string, payload: Partial<AutoModerationRule>, reason?: string): Promise<ChameleonAPIResult<AutoModerationRule>> {

    const result = await this.rest.patch<unknown>(`/guilds/${guildId}/auto-moderation/rules/${ruleId}`, toSnakeCase(payload), createAuditLogHeaders(reason))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._cacheRule(result.data as Record<string, unknown>) }
  }

  async delete(guildId: string, ruleId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.delete(`/guilds/${guildId}/auto-moderation/rules/${ruleId}`, createAuditLogHeaders(reason))
    
    if (result.ok) this.store.autoModRules.delete(ruleId)
    
    return result as ChameleonAPIResult<void>
  }
}