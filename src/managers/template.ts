import type { ChameleonREST } from '../rest/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { GuildTemplate } from '../types/guild/index.js'
import { toSnakeCase, toCamelCase } from '../utils/object.js'

export class TemplateManager {

  constructor (
    protected rest: ChameleonREST
  ) {}

  async fetch(code: string): Promise<ChameleonAPIResult<GuildTemplate>> {

    const result = await this.rest.get<unknown>(`/guilds/templates/${code}`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: toCamelCase(result.data as Record<string, unknown>) as GuildTemplate }
  }

  async createGuildFromTemplate(code: string, payload: { name: string, icon?: string }): Promise<ChameleonAPIResult<unknown>> {
    
    const result = await this.rest.post<unknown>(`/guilds/templates/${code}`, toSnakeCase(payload))
    
    return result as ChameleonAPIResult<unknown>
  }

  async list(guildId: string): Promise<ChameleonAPIResult<GuildTemplate[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/templates`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: (result.data as Record<string, unknown>[]).map(t => toCamelCase(t) as GuildTemplate) }
  }

  async create(guildId: string, payload: { name: string, description?: string }): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.post<unknown>(`/guilds/${guildId}/templates`, toSnakeCase(payload))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: toCamelCase(result.data as Record<string, unknown>) as GuildTemplate }
  }

  async sync(guildId: string, code: string): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.put<unknown>(`/guilds/${guildId}/templates/${code}`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: toCamelCase(result.data as Record<string, unknown>) as GuildTemplate }
  }

  async edit(guildId: string, code: string, payload: { name?: string, description?: string }): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.patch<unknown>(`/guilds/${guildId}/templates/${code}`, toSnakeCase(payload))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: toCamelCase(result.data as Record<string, unknown>) as GuildTemplate }
  }

  async delete(guildId: string, code: string): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.delete<unknown>(`/guilds/${guildId}/templates/${code}`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: toCamelCase(result.data as Record<string, unknown>) as GuildTemplate }
  }
}