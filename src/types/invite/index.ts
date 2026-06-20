import type { User } from '../user/index.js'
import type { Guild, Member } from '../guild/index.js'
import type { Channel } from '../channel/index.js'
import type { Application } from '../application/index.js'
import type { GuildScheduledEvent } from '../scheduled/index.js'

export const InviteType = {
  GUILD: 0,
  GROUP_DM: 1,
  FRIEND: 2
} as const

export const InviteTargetType = {
  STREAM: 1,
  EMBEDDED_APPLICATION: 2
} as const

export const GuildInviteFlag = {
  IS_GUEST_INVITE: 1 << 0
} as const

export interface Invite {
  type: number
  code: string
  guild?: Partial<Guild>
  channel: Partial<Channel> | null
  inviter?: User
  targetType?: number
  targetUser?: User
  targetApplication?: Partial<Application>
  approximatePresenceCount?: number
  approximateMemberCount?: number
  expiresAt: number | null // Unix ms
  guildScheduledEvent?: GuildScheduledEvent
  flags?: number
  roles?: Partial<{ id: string; name: string; position: number; color: number; icon: string | null; unicodeEmoji: string | null }>[]
  uses?: number
  maxUses?: number
  maxAge?: number
  temporary?: boolean
  createdAt?: number // Unix ms
}

export interface InviteMetadata {
  uses: number
  maxUses: number
  maxAge: number
  temporary: boolean
  createdAt: number // Unix ms
}

export interface InviteStageInstance {
  members: Partial<Member>[]
  participantCount: number
  speakerCount: number
  topic: string
}