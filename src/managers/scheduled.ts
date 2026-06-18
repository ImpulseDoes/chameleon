import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildScheduledEvent, buildUser } from '../builders/index.js'
import type { GuildScheduledEvent, GuildScheduledEventUser } from '../types/scheduled/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class ScheduledEventManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  private _cacheEvent(raw: Record<string, unknown>): GuildScheduledEvent {

    const event = buildScheduledEvent(raw)
    this.store.scheduledEvents.set(event.id, event)
    
    return event
  }

  async list(guildId: string, withUserCount?: boolean): Promise<ChameleonAPIResult<GuildScheduledEvent[]>> {

    let url = `/guilds/${guildId}/scheduled-events`
    if (withUserCount) url += '?with_user_count=true'

    const result = await this.rest.get<unknown[]>(url)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const events = (result.data as Record<string, unknown>[]).map(event => this._cacheEvent(event))

    return { ok: true, data: events }
  }

  async fetch(guildId: string, eventId: string, withUserCount?: boolean): Promise<ChameleonAPIResult<GuildScheduledEvent>> {

    const cached = this.store.scheduledEvents.get(eventId)
    if (cached && !withUserCount) return { ok: true, data: cached }

    let url = `/guilds/${guildId}/scheduled-events/${eventId}`
    if (withUserCount) url += '?with_user_count=true'

    const result = await this.rest.get<unknown>(url)
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: this._cacheEvent(result.data as Record<string, unknown>) }
  }

  async create(guildId: string, payload: Partial<GuildScheduledEvent>, reason?: string): Promise<ChameleonAPIResult<GuildScheduledEvent>> {

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/scheduled-events`, toSnakeCase(payload), createAuditLogHeaders(reason))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._cacheEvent(result.data as Record<string, unknown>) }
  }

  async edit(guildId: string, eventId: string, payload: Partial<GuildScheduledEvent>, reason?: string): Promise<ChameleonAPIResult<GuildScheduledEvent>> {

    const result = await this.rest.patch<unknown>(`/guilds/${guildId}/scheduled-events/${eventId}`, toSnakeCase(payload), createAuditLogHeaders(reason))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._cacheEvent(result.data as Record<string, unknown>) }
  }

  async delete(guildId: string, eventId: string): Promise<ChameleonAPIResult<void>> {
    
    const result = await this.rest.delete(`/guilds/${guildId}/scheduled-events/${eventId}`)
    if (result.ok) this.store.scheduledEvents.delete(eventId)
    
    return result as ChameleonAPIResult<void>
  }

  async getUsers(guildId: string, eventId: string, options?: { limit?: number, withMember?: boolean, before?: string, after?: string }): Promise<ChameleonAPIResult<GuildScheduledEventUser[]>> {
    
    let url = `/guilds/${guildId}/scheduled-events/${eventId}/users`
    
    if (options) {
      
      const params = new URLSearchParams()
      
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.withMember) params.append('with_member', 'true')
      if (options.before) params.append('before', options.before)
      if (options.after) params.append('after', options.after)
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown[]>(url)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const users = (result.data as Record<string, unknown>[]).map(data => {

      return {
        guildScheduledEventId: data.guild_scheduled_event_id as string,
        user: buildUser(data.user as Record<string, unknown>),
        member: data.member as unknown
      } as GuildScheduledEventUser
    })
    
    return { ok: true, data: users }
  }
}