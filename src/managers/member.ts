import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { Member } from '../types/guild/index.js'
import { buildMember } from '../builders/index.js'

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

    const cacheKey = `${this.guildId}:${userId}`

    if (!force) {
      
      const cached = this.store.members.get(cacheKey)

      if (cached) return { ok: true, data: cached }
    }

    const result = await this.rest.get<unknown>(`/guilds/${this.guildId}/members/${userId}`)
    if (!result.ok) return result

    const member = buildMember(result.data as Record<string, unknown>, this.guildId, this.store)
    this.store.members.set(cacheKey, member)

    return { ok: true, data: member }
  }
}