import type { User } from '../user/index.js'
import type { Application } from '../application/index.js'

export const IntegrationExpireBehavior = {
  REMOVE_ROLE: 0,
  KICK: 1
} as const

export interface IntegrationAccount {
  id: string
  name: string
}

export interface Integration {
  id: string
  name: string
  type: string
  enabled: boolean
  syncing?: boolean
  roleId?: string
  enableEmoticons?: boolean
  expireBehavior?: number
  expireGracePeriod?: number
  user?: User
  account: IntegrationAccount
  syncedAt?: number // Unix ms
  subscriberCount?: number
  revoked?: boolean
  application?: Application
  scopes?: string[]
}