import { BaseManager } from './base.js'
import { buildUser } from '../builders/index.js'
import type { User } from '../types/user/index.js'

export class UserManager extends BaseManager<User> {
  
  protected storeKey = 'users' as const
  protected endpoint(id: string) { return `/users/${id}` }
  protected build = buildUser
}