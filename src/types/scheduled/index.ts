import type { User } from '../user/index.js'

export const GuildScheduledEventPrivacyLevel = {
  GUILD_ONLY: 2
} as const

export const GuildScheduledEventStatus = {
  SCHEDULED: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  CANCELED: 4
} as const

export const GuildScheduledEventEntityType = {
  STAGE_INSTANCE: 1,
  VOICE: 2,
  EXTERNAL: 3
} as const

export interface GuildScheduledEventEntityMetadata {
  location?: string
}

export interface GuildScheduledEvent {
  id: string
  guildId: string
  channelId: string | null
  creatorId?: string | null
  name: string
  description?: string | null
  scheduledStartTime: number // Unix ms
  scheduledEndTime: number | null // Unix ms
  privacyLevel: number
  status: number
  entityType: number
  entityId: string | null
  entityMetadata: GuildScheduledEventEntityMetadata | null
  creator?: User
  userCount?: number
  image?: string | null
}

export interface GuildScheduledEventUser {
  guildScheduledEventId: string
  user: User
  member?: unknown
}