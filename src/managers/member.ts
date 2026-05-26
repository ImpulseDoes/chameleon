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
}