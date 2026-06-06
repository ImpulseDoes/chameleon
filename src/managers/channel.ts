import { BaseManager } from './base.js'
import { buildChannel, buildInvite } from '../builders/index.js'
import type { Channel, Overwrite } from '../types/channel/index.js'
import type { Invite } from '../types/invite/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'

export class ChannelManager extends BaseManager<Channel> {

  protected storeKey = 'channels' as const
  protected endpoint(id: string) { return `/channels/${id}` }
  protected build = buildChannel

  async create(guildId: string, payload: Partial<Channel>, reason?: string): Promise<ChameleonAPIResult<Channel>> {

    const headers: Record<string, string> = {}

    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/channels`, toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const entity = this.build(result.data as Record<string, unknown>, guildId)

    this.store.channels.set(entity.id, entity)

    return { ok: true, data: entity }
  }

  async edit(channelId: string, payload: Partial<Channel>, reason?: string): Promise<ChameleonAPIResult<Channel>> {

    const headers: Record<string, string> = {}

    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.patch<unknown>(this.endpoint(channelId), toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const entity = this.build(result.data as Record<string, unknown>)

    this.store.channels.set(entity.id, entity)

    return { ok: true, data: entity }
  }

  async delete(channelId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}

    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.delete(this.endpoint(channelId), headers)

    if (result.ok) this.store.channels.delete(channelId)

    return result as ChameleonAPIResult<void>
  }

  async updatePermissions(channelId: string, overwriteId: string, payload: Partial<Overwrite>, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}

    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    return await this.rest.put(`/channels/${channelId}/permissions/${overwriteId}`, toSnakeCase(payload), headers) as ChameleonAPIResult<void>
  }

  async deletePermission(channelId: string, overwriteId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}

    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    return await this.rest.delete(`/channels/${channelId}/permissions/${overwriteId}`, headers) as ChameleonAPIResult<void>
  }

  async sendTyping(channelId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.post(`/channels/${channelId}/typing`)
    
    return result as ChameleonAPIResult<void>
  }

  async getInvites(channelId: string): Promise<ChameleonAPIResult<Invite[]>> {

    const result = await this.rest.get<unknown[]>(`/channels/${channelId}/invites`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const invites = (result.data as Record<string, unknown>[]).map(i => buildInvite(i))
    
    return { ok: true, data: invites }
  }

  async createInvite(channelId: string, options?: { maxAge?: number, maxUses?: number, temporary?: boolean, unique?: boolean, targetType?: number, targetUserId?: string, targetApplicationId?: string }, reason?: string): Promise<ChameleonAPIResult<Invite>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const payload = options ? toSnakeCase(options) : {}
    const result = await this.rest.post<unknown>(`/channels/${channelId}/invites`, payload, headers)
    
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: buildInvite(result.data as Record<string, unknown>) }
  }

  async followAnnouncementChannel(channelId: string, webhookChannelId: string): Promise<ChameleonAPIResult<{ channelId: string, webhookId: string }>> {
    
    const result = await this.rest.post<unknown>(`/channels/${channelId}/followers`, { webhook_channel_id: webhookChannelId })
    
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    const data = result.data as { channel_id: string, webhook_id: string }
    
    return { ok: true, data: { channelId: data.channel_id, webhookId: data.webhook_id } }
  }

  async createThread(channelId: string, options: { name: string, autoArchiveDuration?: number, type?: number, invitable?: boolean, rateLimitPerUser?: number }, reason?: string): Promise<ChameleonAPIResult<Channel>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.post<unknown>(`/channels/${channelId}/threads`, toSnakeCase(options), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const channel = this.build(result.data as Record<string, unknown>)
    this.store.channels.set(channel.id, channel)
    
    return { ok: true, data: channel }
  }

  async createThreadFromMessage(channelId: string, messageId: string, options: { name: string, autoArchiveDuration?: number, rateLimitPerUser?: number }, reason?: string): Promise<ChameleonAPIResult<Channel>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.post<unknown>(`/channels/${channelId}/messages/${messageId}/threads`, toSnakeCase(options), headers)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const channel = this.build(result.data as Record<string, unknown>)
    this.store.channels.set(channel.id, channel)
    
    return { ok: true, data: channel }
  }

  async joinThread(channelId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.put(`/channels/${channelId}/thread-members/@me`)
    
    return result as ChameleonAPIResult<void>
  }

  async leaveThread(channelId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.delete(`/channels/${channelId}/thread-members/@me`)
    
    return result as ChameleonAPIResult<void>
  }

  async listActiveThreads(guildId: string): Promise<ChameleonAPIResult<{ threads: Channel[], members: unknown[] }>> {

    const result = await this.rest.get<unknown>(`/guilds/${guildId}/threads/active`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const data = result.data as { threads: Record<string, unknown>[], members: unknown[] }
    const threads = data.threads.map(t => {
      
      const channel = this.build(t, guildId)
      
      this.store.channels.set(channel.id, channel)
      
      return channel
    })
    
    return { ok: true, data: { threads, members: data.members } }
  }
}