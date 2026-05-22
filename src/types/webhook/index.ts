import type { User } from '../user/index.js'
import type { Guild } from '../guild/index.js'
import type { Channel } from '../channel/index.js'

export const WebhookType = {
  INCOMING: 1,
  CHANNEL_FOLLOWER: 2,
  APPLICATION: 3
} as const

export interface Webhook {
  id: string
  type: number
  guildId?: string
  channelId?: string | null
  user?: User
  name: string | null
  avatar: string | null
  token?: string
  applicationId: string | null
  sourceGuild?: Partial<Guild>
  sourceChannel?: Partial<Channel>
  url?: string
}