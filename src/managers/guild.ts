import { BaseManager } from './base.js'
import { buildGuild, buildChannel } from '../builders/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'

export class GuildManager extends BaseManager<Guild> {

  protected storeKey = 'guilds' as const
  protected endpoint(id: string) { return `/guilds/${id}` }
  protected build = buildGuild

  async fetchChannels(guildId: string): Promise<ChameleonAPIResult<Channel[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/channels`)
    
    if (!result.ok) return result

    const channels = result.data.map(raw => buildChannel(raw as Record<string, unknown>, guildId))
    
    for (const c of channels) {
      this.store.channels.set(c.id, c)
    }

    return { ok: true, data: channels }
  }

  async ban(guildId: string, userId: string, options?: { deleteMessageSeconds?: number; reason?: string }): Promise<ChameleonAPIResult<void>> {
    
    const payload: Record<string, any> = {}
    
    if (options?.deleteMessageSeconds !== undefined) payload.delete_message_seconds = options.deleteMessageSeconds
    
    const headers: Record<string, string> = {}
    if (options?.reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(options.reason)

    const result = await this.rest.put(`/guilds/${guildId}/bans/${userId}`, payload, headers)
    return result as ChameleonAPIResult<void>
  }

  async unban(guildId: string, userId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.delete(`/guilds/${guildId}/bans/${userId}`, headers)
    return result as ChameleonAPIResult<void>
  }

  async kick(guildId: string, userId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.delete(`/guilds/${guildId}/members/${userId}`, headers)
    
    if (result.ok) {
      this.store.members.delete(`${guildId}:${userId}`)
    }
    
    return result as ChameleonAPIResult<void>
  }
}