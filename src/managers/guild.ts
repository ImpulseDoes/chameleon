import { BaseManager } from './base.js'
import { buildGuild, buildChannel } from '../builders/index.js'
import { RoleManager } from './role.js'
import { MemberManager } from './member.js'
import { TongueStore } from '../client/store.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'

export class GuildManager extends BaseManager<Guild> {

  protected storeKey = 'guilds' as const
  protected endpoint(id: string) { return `/guilds/${id}` }
  protected build = buildGuild

  roles(guildId: string): RoleManager {
    return new RoleManager(this.rest, this.store, guildId)
  }

  members(guildId: string): MemberManager {
    return new MemberManager(this.rest, this.store, guildId)
  }

  async fetchChannels(guildId: string): Promise<ChameleonAPIResult<Channel[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/channels`)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const channels = result.data.map(raw => buildChannel(raw as Record<string, unknown>, guildId))

    for (const c of channels) {
      this.store.channels.set(c.id, c)
    }

    return { ok: true, data: channels }
  }

  async ban(guildId: string, userId: string, options?: { deleteMessageSeconds?: number; reason?: string }): Promise<ChameleonAPIResult<void>> {

    const payload: Record<string, unknown> = {}

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
      this.store.members.delete(TongueStore.memberKey(guildId, userId))
    }

    return result as ChameleonAPIResult<void>
  }

  async edit(guildId: string, payload: Partial<Guild>, reason?: string): Promise<ChameleonAPIResult<Guild>> {

    const headers: Record<string, string> = {}

    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.patch<unknown>(this.endpoint(guildId), toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const entity = this.build(result.data as Record<string, unknown>)

    this.store.guilds.set(entity.id, entity)

    return { ok: true, data: entity }
  }

  async delete(guildId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.delete(this.endpoint(guildId))

    if (result.ok) this.store.guilds.delete(guildId)

    return result as ChameleonAPIResult<void>
  }
}