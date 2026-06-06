import type { ChameleonREST } from '../rest/index.js'
import { TongueStore } from '../client/store.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { Member } from '../types/guild/index.js'
import { buildMember } from '../builders/index.js'
import { toSnakeCase } from '../utils/object.js'

export class MemberManager {

  private guildId: string

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore,
    guildId: string
  ) {
    this.guildId = guildId
  }

  async fetch(userId: string, force = false): Promise<ChameleonAPIResult<Member>> {

    const cacheKey = TongueStore.memberKey(this.guildId, userId)

    if (!force) {

      const cached = this.store.members.get(cacheKey)

      if (cached) return { ok: true, data: cached }
    }

    const result = await this.rest.get<unknown>(`/guilds/${this.guildId}/members/${userId}`)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const member = buildMember(result.data as Record<string, unknown>, this.guildId, this.store)
    this.store.members.set(cacheKey, member)

    return { ok: true, data: member }
  }

  async edit(userId: string, payload: Partial<Member>, reason?: string): Promise<ChameleonAPIResult<Member>> {

    const headers: Record<string, string> = {}

    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.patch<unknown>(`/guilds/${this.guildId}/members/${userId}`, toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const cacheKey = TongueStore.memberKey(this.guildId, userId)
    const member = buildMember(result.data as Record<string, unknown>, this.guildId, this.store)
    this.store.members.set(cacheKey, member)

    return { ok: true, data: member }
  }

  async list(options?: { limit?: number, after?: string }): Promise<ChameleonAPIResult<Member[]>> {

    let url = `/guilds/${this.guildId}/members`
    
    if (options) {
      
      const params = new URLSearchParams()
      
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.after) params.append('after', options.after)
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown[]>(url)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const members = (result.data as Record<string, unknown>[]).map(m => {
      
      const member = buildMember(m, this.guildId, this.store)
      
      if (member.user) {
        this.store.members.set(TongueStore.memberKey(this.guildId, member.user.id), member)
      }
      
      return member
    })

    return { ok: true, data: members }
  }

  async search(query: string, limit?: number): Promise<ChameleonAPIResult<Member[]>> {

    const params = new URLSearchParams({ query })
    
    if (limit) params.append('limit', limit.toString())

    const result = await this.rest.get<unknown[]>(`/guilds/${this.guildId}/members/search?${params.toString()}`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const members = (result.data as Record<string, unknown>[]).map(m => {
      
      const member = buildMember(m, this.guildId, this.store)
      
      if (member.user) {
        this.store.members.set(TongueStore.memberKey(this.guildId, member.user.id), member)
      }

      return member
    })

    return { ok: true, data: members }
  }

  async addRole(userId: string, roleId: string, reason?: string): Promise<ChameleonAPIResult<void>> {
   
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.put(`/guilds/${this.guildId}/members/${userId}/roles/${roleId}`, undefined, headers)
    
    return result as ChameleonAPIResult<void>
  }

  async removeRole(userId: string, roleId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.delete(`/guilds/${this.guildId}/members/${userId}/roles/${roleId}`, headers)
    
    return result as ChameleonAPIResult<void>
  }

  async timeout(userId: string, until: number | Date | null, reason?: string): Promise<ChameleonAPIResult<Member>> {

    const isoString = until ? (until instanceof Date ? until.toISOString() : new Date(until).toISOString()) : null
    
    return this.edit(userId, { communicationDisabledUntil: isoString as any }, reason)
  }
}