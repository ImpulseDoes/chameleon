import { BaseManager } from './base.js'
import { buildChannel, buildInvite, serializeComponent } from '../builders/index.js'
import type { AttachmentBuilder } from '../builders/attachment.js'
import type { Channel, Overwrite } from '../types/channel/index.js'
import type { Invite } from '../types/invite/index.js'
import type { Embed } from '../types/message/index.js'
import type { MessageComponent } from '../types/components/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class ChannelManager extends BaseManager<Channel> {

  protected storeKey = 'channels' as const
  protected endpoint(id: string) { return `/channels/${id}` }
  protected build = buildChannel

  async create(guildId: string, payload: Partial<Channel>, reason?: string): Promise<ChameleonAPIResult<Channel>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/channels`, toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const entity = this.build(result.data as Record<string, unknown>, guildId)

    this.store.channels.set(entity.id, entity)

    return { ok: true, data: entity }
  }

  async edit(channelId: string, payload: Partial<Channel>, reason?: string): Promise<ChameleonAPIResult<Channel>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.patch<unknown>(this.endpoint(channelId), toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const entity = this.build(result.data as Record<string, unknown>)

    this.store.channels.set(entity.id, entity)

    return { ok: true, data: entity }
  }

  async delete(channelId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.delete(this.endpoint(channelId), headers)

    if (result.ok) this.store.channels.delete(channelId)

    return result as ChameleonAPIResult<void>
  }

  async clone(channelId: string, options?: Partial<Channel>, reason?: string): Promise<ChameleonAPIResult<Channel>> {

    let cached = this.store.channels.get(channelId)
    
    if (!cached) {

      const fetched = await this.fetch(channelId)
      
      if (!fetched.ok) return fetched as ChameleonAPIResult<never>
      
      cached = fetched.data
    }

    const payload: Partial<Channel> = {}

    if (cached.name !== undefined) payload.name = cached.name
    if (cached.type !== undefined) payload.type = cached.type
    if (cached.topic !== undefined) payload.topic = cached.topic
    if (cached.bitrate !== undefined) payload.bitrate = cached.bitrate
    if (cached.userLimit !== undefined) payload.userLimit = cached.userLimit
    if (cached.rateLimitPerUser !== undefined) payload.rateLimitPerUser = cached.rateLimitPerUser
    if (cached.nsfw !== undefined) payload.nsfw = cached.nsfw
    if (cached.position !== undefined) payload.position = cached.position
    if (cached.parentId !== undefined) payload.parentId = cached.parentId
    if (cached.permissionOverwrites !== undefined) payload.permissionOverwrites = cached.permissionOverwrites
    if (options) Object.assign(payload, options)

    if (!cached.guildId) return { ok: false, status: 400, error: 'Cannot clone a DM channel', message: 'Cannot clone a DM channel' } as ChameleonAPIResult<never>

    return this.create(cached.guildId, payload, reason)
  }

  async setPositions(guildId: string, positions: { id: string, position?: number, lockPermissions?: boolean, parentId?: string }[], reason?: string): Promise<ChameleonAPIResult<void>> {
    
    const headers = createAuditLogHeaders(reason)

    const payload = positions.map(p => ({
      id: p.id,
      ...(p.position !== undefined ? { position: p.position } : {}),
      ...(p.lockPermissions !== undefined ? { lock_permissions: p.lockPermissions } : {}),
      ...(p.parentId !== undefined ? { parent_id: p.parentId } : {})
    }))

    const result = await this.rest.patch(`/guilds/${guildId}/channels`, payload, headers)
    
    return result as ChameleonAPIResult<void>
  }

  async updatePermissions(channelId: string, overwriteId: string, payload: Partial<Overwrite>, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

    return await this.rest.put(`/channels/${channelId}/permissions/${overwriteId}`, toSnakeCase(payload), headers) as ChameleonAPIResult<void>
  }

  async deletePermission(channelId: string, overwriteId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

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
    
    const headers = createAuditLogHeaders(reason)

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
    
    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.post<unknown>(`/channels/${channelId}/threads`, toSnakeCase(options), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const channel = this.build(result.data as Record<string, unknown>)
    this.store.channels.set(channel.id, channel)
    
    return { ok: true, data: channel }
  }

  async createThreadFromMessage(channelId: string, messageId: string, options: { name: string, autoArchiveDuration?: number, rateLimitPerUser?: number }, reason?: string): Promise<ChameleonAPIResult<Channel>> {
    
    const headers = createAuditLogHeaders(reason)

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

  async listArchivedThreads(channelId: string, type: 'public' | 'private', options?: { before?: string, limit?: number }): Promise<ChameleonAPIResult<{ threads: Channel[], members: unknown[], hasMore: boolean }>> {
    
    let url = `/channels/${channelId}/threads/archived/${type}`
    
    if (options) {

      const params = new URLSearchParams()
      
      if (options.before) params.append('before', options.before)
      if (options.limit) params.append('limit', options.limit.toString())
      
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown>(url)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const data = result.data as { threads: Record<string, unknown>[], members: unknown[], has_more: boolean }
    const threads = data.threads.map(t => {
      const channel = this.build(t)
      this.store.channels.set(channel.id, channel)
      return channel
    })

    return { ok: true, data: { threads, members: data.members, hasMore: data.has_more } }
  }

  async addThreadMember(channelId: string, userId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.put(`/channels/${channelId}/thread-members/${userId}`)
    
    return result as ChameleonAPIResult<void>
  }

  async removeThreadMember(channelId: string, userId: string): Promise<ChameleonAPIResult<void>> {
    
    const result = await this.rest.delete(`/channels/${channelId}/thread-members/${userId}`)
    
    return result as ChameleonAPIResult<void>
  }

  async createForumThread(channelId: string, options: {
    name: string
    autoArchiveDuration?: number
    rateLimitPerUser?: number
    appliedTags?: string[]
    message: {
      content?: string
      embeds?: (Embed | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
      components?: (MessageComponent | { build?(): MessageComponent } | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
      files?: AttachmentBuilder[]
    }
  }, reason?: string): Promise<ChameleonAPIResult<Channel>> {

    const headers = createAuditLogHeaders(reason)

    const messagePayload: Record<string, unknown> = {}

    if (options.message.content) messagePayload.content = options.message.content
    if (options.message.embeds) {
      messagePayload.embeds = options.message.embeds.map(e => 
        (e && typeof (e as { toJSON?(): Record<string, unknown> }).toJSON === 'function' 
          ? (e as { toJSON(): Record<string, unknown> }).toJSON() 
          : e)
      )
    }
    
    if (options.message.components) {
      messagePayload.components = options.message.components.map(c => serializeComponent(c))
    }

    const payload: Record<string, unknown> = {
      name: options.name,
      message: messagePayload,
      ...(options.autoArchiveDuration !== undefined ? { auto_archive_duration: options.autoArchiveDuration } : {}),
      ...(options.rateLimitPerUser !== undefined ? { rate_limit_per_user: options.rateLimitPerUser } : {}),
      ...(options.appliedTags ? { applied_tags: options.appliedTags } : {}),
    }

    let result: ChameleonAPIResult<unknown>

    if (options.message.files && options.message.files.length > 0) {
      result = await this.rest.requestWithFiles<unknown>('POST', `/channels/${channelId}/threads`, payload, options.message.files, headers)
    } else {
      result = await this.rest.post<unknown>(`/channels/${channelId}/threads`, payload, headers)
    }

    if (!result.ok) return result as ChameleonAPIResult<never>

    const channel = this.build(result.data as Record<string, unknown>)
    this.store.channels.set(channel.id, channel)

    return { ok: true, data: channel }
  }
}