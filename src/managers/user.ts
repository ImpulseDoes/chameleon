import { BaseManager } from './base.js'
import { buildUser } from '../builders/index.js'
import type { User } from '../types/user/index.js'
import { toSnakeCase } from '../utils/object.js'
import type { ChameleonAPIResult } from '../rest/types.js'
export class UserManager extends BaseManager<User> {
  
  protected storeKey = 'users' as const
  protected endpoint(id: string) { return `/users/${id}` }
  protected build = buildUser

  async createDM(userId: string): Promise<import('../rest/types.js').ChameleonAPIResult<import('../types/channel/index.js').Channel>> {
    
    const result = await this.rest.post<unknown>('/users/@me/channels', { recipient_id: userId })
    
    if (!result.ok) return result as import('../rest/types.js').ChameleonAPIResult<never>
    
    return { ok: true, data: (await import('../builders/index.js')).buildChannel(result.data as Record<string, unknown>) }
  }

  async editCurrent(payload: { username?: string, avatar?: string | null }): Promise<ChameleonAPIResult<User>> {

    const result = await this.rest.patch<unknown>('/users/@me', toSnakeCase(payload))
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const user = this.build(result.data as Record<string, unknown>)
    
    this.store.users.set(user.id, user)
    
    return { ok: true, data: user }
  }
}