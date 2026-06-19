import type { ChameleonREST } from '../rest/index.js'
import { buildInvite } from '../builders/index.js'
import type { Invite } from '../types/invite/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { createAuditLogHeaders } from './shared.js'

export class InviteManager {

  constructor (protected rest: ChameleonREST) {}

  async fetch(code: string, options?: { withCounts?: boolean, withExpiration?: boolean, guildScheduledEventId?: string }): Promise<ChameleonAPIResult<Invite>> {
    
    let url = `/invites/${code}`
    
    if (options) {
      
      const params = new URLSearchParams()
      
      if (options.withCounts) params.append('with_counts', 'true')
      if (options.withExpiration) params.append('with_expiration', 'true')
      if (options.guildScheduledEventId) params.append('guild_scheduled_event_id', options.guildScheduledEventId)
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown>(url)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: buildInvite(result.data as Record<string, unknown>) }
  }

  async delete(code: string, reason?: string): Promise<ChameleonAPIResult<Invite>> {
    
    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.delete(`/invites/${code}`, headers)
    if (!result.ok) return result as ChameleonAPIResult<never>

    // DELETE /invites/{code} returns the deleted invite object
    return { ok: true, data: buildInvite(result.data as Record<string, unknown>) }
  }
}