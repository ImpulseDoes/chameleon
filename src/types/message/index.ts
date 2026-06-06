import type { User } from '../user/index.js'
import type { Channel } from '../channel/index.js'
import type { Member } from '../guild/index.js'
import type { Emoji, Sticker, StickerItem } from '../expressions/index.js'
import type { Application } from '../application/index.js'
import type { MessageComponent } from '../components/index.js'
import type { MessageInteraction, ResolvedData } from '../interaction/index.js'
import type { AttachmentBuilder } from '../../builders/attachment.js'

export interface ChannelMention {
  id: string
  guildId: string
  type: number
  name: string
}

export interface Attachment {
  id: string
  filename: string
  title?: string
  description?: string
  contentType?: string
  size: number
  url: string
  proxyUrl: string
  height?: number | null
  width?: number | null
  placeholder?: string
  placeholderVersion?: number
  ephemeral?: boolean
  durationSecs?: number
  waveform?: string
  flags?: number
  clipParticipants?: User[]
  clipCreatedAt?: number // Unix ms
  application?: Partial<Application>
}

export interface EmbedFooter {
  text: string
  iconUrl?: string
  proxyIconUrl?: string
}

export interface EmbedImage {
  url: string
  proxyUrl?: string
  height?: number
  width?: number
  contentType?: string
  placeholder?: string
  placeholderVersion?: number
  description?: string
  flags?: number
}

export interface EmbedVideo {
  url?: string
  proxyUrl?: string
  height?: number
  width?: number
  contentType?: string
  placeholder?: string
  placeholderVersion?: number
  description?: string
  flags?: number
}

export interface EmbedProvider {
  name?: string
  url?: string
}

export interface EmbedAuthor {
  name: string
  url?: string
  iconUrl?: string
  proxyIconUrl?: string
}

export interface EmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface Embed {
  title?: string
  type?: string
  description?: string
  url?: string
  timestamp?: number // Unix ms
  color?: number
  footer?: EmbedFooter
  image?: EmbedImage
  thumbnail?: EmbedImage
  video?: EmbedVideo
  provider?: EmbedProvider
  author?: EmbedAuthor
  fields?: EmbedField[]
  flags?: number
}

export interface ReactionCountDetails {
  burst: number
  normal: number
}

export interface Reaction {
  count: number
  countDetails: ReactionCountDetails
  me: boolean
  meBurst: boolean
  emoji: Emoji
  burstColors: string[]
}

export interface MessageActivity {
  type: number
  partyId?: string
}

export interface MessageReference {
  type?: number
  messageId?: string
  channelId?: string
  guildId?: string
  failIfNotExists?: boolean
}

export interface MessageInteractionMetadata {
  id: string
  type: number
  user: User
  authorizingIntegrationOwners: Record<string, string>
  originalResponseMessageId?: string
  targetUser?: User
  targetMessageId?: string
  interactedMessageId?: string
  triggeringInteractionMetadata?: MessageInteractionMetadata
}

export interface RoleSubscriptionData {
  roleSubscriptionListingId: string
  tierName: string
  totalMonthsSubscribed: number
  isRenewal: boolean
}

export interface MessageCall {
  participants: string[]
  endedTimestamp?: number | null // Unix ms
}

export interface SharedClientTheme {
  colors: string[]
  gradientAngle: number
  baseMix: number
  baseTheme?: number
}

export interface PollMedia {
  text?: string
  emoji?: Partial<Emoji>
}

export interface PollAnswer {
  answerId?: number
  pollMedia: PollMedia
}

export interface PollAnswerCount {
  id: number
  count: number
  meVoted: boolean
}

export interface PollResults {
  isFinalized: boolean
  answerCounts: PollAnswerCount[]
}

export interface Poll {
  question: PollMedia
  answers: PollAnswer[]
  expiry: number | null // Unix ms
  allowMultiselect: boolean
  layoutType: number
  results?: PollResults
}

export interface PollCreateRequest {
  question: PollMedia
  answers: PollAnswer[]
  /** In hours */
  duration?: number
  allowMultiselect?: boolean
  layoutType?: number
}

export interface MessageSnapshot {
  message: Partial<Message>
}

export interface Message {
  id: string
  channelId: string
  guildId?: string // ge
  author: User
  member?: Member // ge
  content: string
  url: string // added by chameleon
  timestamp: number // Unix ms
  editedTimestamp: number | null // Unix ms
  tts: boolean
  mentionEveryone: boolean
  mentions: User[]
  mentionRoles: string[]
  mentionChannels?: ChannelMention[]
  attachments: Attachment[]
  embeds: Embed[]
  reactions?: Reaction[]
  nonce?: string | number
  pinned: boolean
  webhookId?: string
  type: number
  activity?: MessageActivity
  application?: Partial<Application>
  applicationId?: string
  flags?: number
  messageReference?: MessageReference
  messageSnapshots?: MessageSnapshot[]
  referencedMessage?: Message | null
  interactionMetadata?: MessageInteractionMetadata
  interaction?: MessageInteraction // deprecated
  thread?: Channel
  components?: MessageComponent[]
  stickerItems?: StickerItem[]
  stickers?: Sticker[] // deprecated
  position?: number
  roleSubscriptionData?: RoleSubscriptionData
  resolved?: ResolvedData
  poll?: Poll
  call?: MessageCall
  sharedClientTheme?: SharedClientTheme
}

export interface AttachmentData {
  name: string
  data: Buffer | Uint8Array
  description?: string
  contentType?: string
}

export type MessageCreateOptions = string | {
  content?: string
  embeds?: (Embed | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  components?: (MessageComponent | { build?(): MessageComponent } | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  reply?: { messageId: string, failIfNotExists?: boolean }
  files?: AttachmentBuilder[]
  poll?: PollCreateRequest
}

export type WebhookMessageCreateOptions = string | {
  content?: string
  username?: string
  avatarUrl?: string
  tts?: boolean
  embeds?: (Embed | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  components?: (MessageComponent | { build?(): MessageComponent } | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  threadName?: string
  files?: AttachmentBuilder[]
  poll?: PollCreateRequest
}

export const MessageType = {
  DEFAULT: 0,
  RECIPIENT_ADD: 1,
  RECIPIENT_REMOVE: 2,
  CALL: 3,
  CHANNEL_NAME_CHANGE: 4,
  CHANNEL_ICON_CHANGE: 5,
  CHANNEL_PINNED_MESSAGE: 6,
  USER_JOIN: 7,
  GUILD_BOOST: 8,
  GUILD_BOOST_TIER_1: 9,
  GUILD_BOOST_TIER_2: 10,
  GUILD_BOOST_TIER_3: 11,
  CHANNEL_FOLLOW_ADD: 12,
  GUILD_DISCOVERY_DISQUALIFIED: 14,
  GUILD_DISCOVERY_REQUALIFIED: 15,
  GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING: 16,
  GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING: 17,
  THREAD_CREATED: 18,
  REPLY: 19,
  CHAT_INPUT_COMMAND: 20,
  THREAD_STARTER_MESSAGE: 21,
  GUILD_INVITE_REMINDER: 22,
  CONTEXT_MENU_COMMAND: 23,
  AUTO_MODERATION_ACTION: 24,
  ROLE_SUBSCRIPTION_PURCHASE: 25,
  INTERACTION_PREMIUM_UPSELL: 26,
  STAGE_START: 27,
  STAGE_END: 28,
  STAGE_SPEAKER: 29,
  STAGE_TOPIC: 31,
  GUILD_APPLICATION_PREMIUM_SUBSCRIPTION: 32,
  GUILD_INCIDENT_ALERT_MODE_ENABLED: 36,
  GUILD_INCIDENT_ALERT_MODE_DISABLED: 37,
  GUILD_INCIDENT_REPORT_RAID: 38,
  GUILD_INCIDENT_REPORT_FALSE_ALARM: 39,
  PURCHASE_NOTIFICATION: 44,
  POLL_RESULT: 46
} as const

export const MessageActivityType = {
  JOIN: 1,
  SPECTATE: 2,
  LISTEN: 3,
  JOIN_REQUEST: 5
} as const

export const MessageFlag = {
  CROSSPOSTED: 1 << 0,
  IS_CROSSPOST: 1 << 1,
  SUPPRESS_EMBEDS: 1 << 2,
  SOURCE_MESSAGE_DELETED: 1 << 3,
  URGENT: 1 << 4,
  HAS_THREAD: 1 << 5,
  EPHEMERAL: 1 << 6,
  LOADING: 1 << 7,
  FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 1 << 8,
  SUPPRESS_NOTIFICATIONS: 1 << 12,
  IS_VOICE_MESSAGE: 1 << 13,
  HAS_SNAPSHOT: 1 << 14,
  IS_COMPONENTS_V2: 1 << 15
} as const

export const MessageReferenceType = {
  DEFAULT: 0,
  FORWARD: 1
} as const

export const EmbedType = {
  RICH: 'rich',
  IMAGE: 'image',
  VIDEO: 'video',
  GIFV: 'gifv',
  ARTICLE: 'article',
  LINK: 'link',
  POLL_RESULT: 'poll_result'
} as const

export const AttachmentFlag = {
  IS_CLIP: 1 << 0,
  IS_THUMBNAIL: 1 << 1,
  IS_REMIX: 1 << 2,
  IS_SPOILER: 1 << 3,
  IS_ANIMATED: 1 << 5
} as const

export interface AttachmentData {
  name: string
  data: Buffer | Uint8Array
  description?: string
  contentType?: string
}