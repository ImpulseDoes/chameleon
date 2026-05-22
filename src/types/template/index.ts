import type { User } from '../user/index.js'
import type { Guild } from '../guild/index.js'

export interface GuildTemplate {
  code: string
  name: string
  description: string | null
  usageCount: number
  creatorId: string
  creator: User
  createdAt: number // Unix ms
  updatedAt: number // Unix ms
  sourceGuildId: string
  serializedSourceGuild: Partial<Guild>
  isDirty: boolean | null
}