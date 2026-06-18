import type { ChameleonREST } from '../rest/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { GuildTemplate } from '../types/guild/index.js'
import { toSnakeCase, toCamelCase } from '../utils/object.js'

export class TemplateManager {

  constructor (
    protected rest: ChameleonREST
  ) {}

  private _transformTemplate(data: unknown): GuildTemplate {
    return toCamelCase(data as Record<string, unknown>) as GuildTemplate
  }

  private _transformTemplates(data: unknown[]): GuildTemplate[] {
    return data.map(template => this._transformTemplate(template))
  }

  async fetch(code: string): Promise<ChameleonAPIResult<GuildTemplate>> {

    const result = await this.rest.get<unknown>(`/guilds/templates/${code}`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._transformTemplate(result.data) }
  }

  async createGuildFromTemplate(code: string, payload: { name: string, icon?: string }): Promise<ChameleonAPIResult<unknown>> {
    
    const result = await this.rest.post<unknown>(`/guilds/templates/${code}`, toSnakeCase(payload))
    
    return result as ChameleonAPIResult<unknown>
  }

  async list(guildId: string): Promise<ChameleonAPIResult<GuildTemplate[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/templates`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._transformTemplates(result.data) }
  }

  async create(guildId: string, payload: { name: string, description?: string }): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.post<unknown>(`/guilds/${guildId}/templates`, toSnakeCase(payload))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._transformTemplate(result.data) }
  }

  async sync(guildId: string, code: string): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.put<unknown>(`/guilds/${guildId}/templates/${code}`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._transformTemplate(result.data) }
  }

  async edit(guildId: string, code: string, payload: { name?: string, description?: string }): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.patch<unknown>(`/guilds/${guildId}/templates/${code}`, toSnakeCase(payload))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._transformTemplate(result.data) }
  }

  async delete(guildId: string, code: string): Promise<ChameleonAPIResult<GuildTemplate>> {
    
    const result = await this.rest.delete<unknown>(`/guilds/${guildId}/templates/${code}`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._transformTemplate(result.data) }
  }
}