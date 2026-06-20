import type { User } from '../user/index.js'
import type { Member } from '../guild/index.js'

export interface Channel {
  id: string
  type: number
  guildId?: string
  position?: number
  permissionOverwrites?: Overwrite[]
  name?: string | null
  topic?: string | null
  nsfw?: boolean
  lastMessageId?: string | null
  bitrate?: number
  userLimit?: number
  rateLimitPerUser?: number
  recipients?: User[]
  icon?: string | null
  ownerId?: string
  applicationId?: string
  managed?: boolean
  parentId?: string | null
  lastPinTimestamp?: number | null // Unix ms
  rtcRegion?: string | null
  videoQualityMode?: number
  messageCount?: number
  memberCount?: number
  threadMetadata?: ThreadMetadata
  member?: ThreadMember
  defaultAutoArchiveDuration?: number
  permissions?: string
  flags?: number
  totalMessageSent?: number
  availableTags?: ForumTag[]
  appliedTags?: string[]
  defaultReactionEmoji?: DefaultReaction | null
  defaultThreadRateLimitPerUser?: number
  defaultSortOrder?: number | null
  defaultForumLayout?: number
}

export interface Overwrite {
  id: string
  type: number // 0 for role, 1 for member
  allow: string
  deny: string
}

export interface ThreadMetadata {
  archived: boolean
  autoArchiveDuration: number
  archiveTimestamp: number // Unix ms
  locked: boolean
  invitable?: boolean
  createTimestamp?: number | null // Unix ms
}

export interface ThreadMember {
  id?: string
  userId?: string
  joinTimestamp: number // Unix ms
  flags: number
  member?: Member
  presence?: Record<string, unknown>
}

export interface DefaultReaction {
  emojiId: string | null
  emojiName: string | null
}

export interface ForumTag {
  id: string
  name: string
  moderated: boolean
  emojiId: string | null
  emojiName: string | null
}

export const ChannelType = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_ANNOUNCEMENT: 5,
  ANNOUNCEMENT_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15,
  GUILD_MEDIA: 16
} as const

export const VideoQualityMode = {
  AUTO: 1,
  FULL: 2
} as const

export const ChannelFlag = {
  PINNED: 1 << 1,
  REQUIRE_TAG: 1 << 4,
  HIDE_MEDIA_DOWNLOAD_OPTIONS: 1 << 15
} as const

export const SortOrderType = {
  LATEST_ACTIVITY: 0,
  CREATION_DATE: 1
} as const

export const ForumLayoutType = {
  NOT_SET: 0,
  LIST_VIEW: 1,
  GALLERY_VIEW: 2
} as const