import { BaseManager } from './base.js'
import { buildGuild, buildChannel, buildUser, buildInvite } from '../builders/index.js'
import { RoleManager } from './role.js'
import { MemberManager } from './member.js'
import { TongueStore } from '../client/store.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { User } from '../types/user/index.js'
import type { Invite } from '../types/invite/index.js'
import type { AuditLog } from '../types/audit/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase, toCamelCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class GuildManager extends BaseManager<Guild> {

  protected storeKey = 'guilds' as const
  protected endpoint(id: string) { return `/guilds/${id}` }
  protected build = buildGuild

  private roleManagers = new Map<string, RoleManager>()
  private memberManagers = new Map<string, MemberManager>()

  roles(guildId: string): RoleManager {
    let manager = this.roleManagers.get(guildId)
    if (!manager) {
      manager = new RoleManager(this.rest, this.store, guildId)
      this.roleManagers.set(guildId, manager)
    }
    return manager
  }

  members(guildId: string): MemberManager {

    let manager = this.memberManagers.get(guildId)
    
    if (!manager) {
      manager = new MemberManager(this.rest, this.store, guildId)
      this.memberManagers.set(guildId, manager)
    }
    
    return manager
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

    const headers = createAuditLogHeaders(options?.reason)

    const result = await this.rest.put(`/guilds/${guildId}/bans/${userId}`, payload, headers)
    return result as ChameleonAPIResult<void>
  }

  async unban(guildId: string, userId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.delete(`/guilds/${guildId}/bans/${userId}`, headers)
    return result as ChameleonAPIResult<void>
  }

  async kick(guildId: string, userId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.delete(`/guilds/${guildId}/members/${userId}`, headers)

    if (result.ok) {
      this.store.members.delete(TongueStore.memberKey(guildId, userId))
    }

    return result as ChameleonAPIResult<void>
  }

  async edit(guildId: string, payload: Partial<Guild>, reason?: string): Promise<ChameleonAPIResult<Guild>> {

    const headers = createAuditLogHeaders(reason)

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

  async listBans(guildId: string, options?: { limit?: number, before?: string, after?: string }): Promise<ChameleonAPIResult<{ reason: string | null, user: User }[]>> {
    
    let url = `/guilds/${guildId}/bans`
    
    if (options) {

      const params = new URLSearchParams()
      
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.before) params.append('before', options.before)
      if (options.after) params.append('after', options.after)
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown[]>(url)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const bans = (result.data as Record<string, unknown>[]).map(b => ({
      reason: (b.reason as string | null) ?? null,
      user: buildUser(b.user as Record<string, unknown>)
    }))
    return { ok: true, data: bans }
  }

  async fetchBan(guildId: string, userId: string): Promise<ChameleonAPIResult<{ reason: string | null, user: User }>> {
    
    const result = await this.rest.get<unknown>(`/guilds/${guildId}/bans/${userId}`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const b = result.data as Record<string, unknown>

    return {
      ok: true,
      data: { reason: (b.reason as string | null) ?? null, user: buildUser(b.user as Record<string, unknown>) }
    }
  }

  async getInvites(guildId: string): Promise<ChameleonAPIResult<Invite[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/invites`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const invites = (result.data as Record<string, unknown>[]).map(i => buildInvite(i))
    
    return { ok: true, data: invites }
  }

  async getVanityURL(guildId: string): Promise<ChameleonAPIResult<{ code: string | null, uses: number }>> {

    const result = await this.rest.get<unknown>(`/guilds/${guildId}/vanity-url`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const data = result.data as Record<string, unknown>
    
    return { ok: true, data: { code: (data.code as string | null) ?? null, uses: (data.uses as number) ?? 0 } }
  }

  async getPruneCount(guildId: string, options?: { days?: number, includeRoles?: string[] }): Promise<ChameleonAPIResult<number>> {

    let url = `/guilds/${guildId}/prune`
    
    if (options) {
      
      const params = new URLSearchParams()
      
      if (options.days) params.append('days', options.days.toString())
      if (options.includeRoles) params.append('include_roles', options.includeRoles.join(','))
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown>(url)

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: ((result.data as Record<string, unknown>).pruned as number) ?? 0 }
  }

  async beginPrune(guildId: string, options?: { days?: number, computePruneCount?: boolean, includeRoles?: string[] }, reason?: string): Promise<ChameleonAPIResult<number | null>> {
    
    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/prune`, toSnakeCase(options ?? {}), headers)
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: ((result.data as Record<string, unknown>).pruned as number | null) ?? null }
  }

  async fetchAuditLog(guildId: string, options?: { userId?: string, actionType?: number, before?: string, after?: string, limit?: number }): Promise<ChameleonAPIResult<AuditLog>> {
    
    let url = `/guilds/${guildId}/audit-logs`
    
    if (options) {
      
      const params = new URLSearchParams()
      
      if (options.userId) params.append('user_id', options.userId)
      if (options.actionType !== undefined) params.append('action_type', options.actionType.toString())
      if (options.before) params.append('before', options.before)
      if (options.after) params.append('after', options.after)
      if (options.limit) params.append('limit', options.limit.toString())

      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown>(url)
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: toCamelCase(result.data) as AuditLog }
  }

  async leave(guildId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.delete(`/users/@me/guilds/${guildId}`)
    return result as ChameleonAPIResult<void>
    
  }
}