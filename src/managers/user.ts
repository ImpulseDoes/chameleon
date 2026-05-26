import { BaseManager } from './base.js'
import { buildUser } from '../builders/index.js'
import type { User } from '../types/user/index.js'

export class UserManager extends BaseManager<User> {
  
  protected storeKey = 'users' as const
  protected endpoint(id: string) { return `/users/${id}` }
  protected build = buildUser

  async createDM(userId: string): Promise<import('../rest/types.js').ChameleonAPIResult<import('../types/channel/index.js').Channel>> {
    
    const result = await this.rest.post<unknown>('/users/@me/channels', { recipient_id: userId })
    
    if (!result.ok) return result as import('../rest/types.js').ChameleonAPIResult<never>
    
    return { ok: true, data: (await import('../builders/index.js')).buildChannel(result.data as Record<string, unknown>) }
  }
}