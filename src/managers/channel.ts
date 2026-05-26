import { BaseManager } from './base.js'
import { buildChannel } from '../builders/index.js'
import type { Channel, Overwrite } from '../types/channel/index.js'
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
}