import type { User, AvatarDecorationData, Collectibles } from '../user/index.js'
import type { Emoji, Sticker } from '../expressions/index.js'

export interface WelcomeScreenChannel {
  channelId: string
  description: string
  emojiId: string | null
  emojiName: string | null
}

export interface WelcomeScreen {
  description: string | null
  welcomeChannels: WelcomeScreenChannel[]
}

export interface IncidentsData {
  invitesDisabledUntil: string | null
  dmsDisabledUntil: string | null
  dmSpamDetectedAt?: string | null
  raidDetectedAt?: string | null
}

export interface Guild {
  id: string
  name: string
  icon: string | null
  iconHash?: string | null
  splash: string | null
  discoverySplash: string | null
  owner?: boolean | null
  ownerId: string
  permissions?: string | null
  region?: string | null
  afkChannelId: string | null
  afkTimeout: number
  widgetEnabled?: boolean
  widgetChannelId?: string | null
  verificationLevel: number
  defaultMessageNotifications: number
  explicitContentFilter: number
  roles: Role[]
  emojis: Emoji[]
  features: string[]
  mfaLevel: number
  applicationId: string | null
  systemChannelId: string | null
  systemChannelFlags: number
  rulesChannelId: string | null
  maxPresences?: number | null
  maxMembers?: number
  vanityUrlCode: string | null
  description: string | null
  banner: string | null
  premiumTier: number
  premiumSubscriptionCount?: number
  preferredLocale: string
  publicUpdatesChannelId: string | null
  maxVideoChannelUsers?: number
  maxStageVideoChannelUsers?: number
  approximateMemberCount?: number
  approximatePresenceCount?: number
  welcomeScreen?: WelcomeScreen
  nsfwLevel: number
  stickers?: Sticker[]
  premiumProgressBarEnabled: boolean
  safetyAlertsChannelId?: string | null
  incidentsData?: IncidentsData | null
}

export interface Member {
  user?: User
  nick?: string | null
  avatar?: string | null
  banner?: string | null
  roles: string[]
  joinedAt: number | null // Unix ms
  premiumSince?: number | null // Unix ms
  deaf: boolean
  mute: boolean
  flags: number
  pending?: boolean
  permissions?: string
  communicationDisabledUntil?: number | null // Unix ms
  avatarDecorationData?: AvatarDecorationData | null
  collectibles?: Collectibles | null
}

export interface Role {
  id: string
  name: string
  color: number
  hoist: boolean
  icon?: string | null
  unicodeEmoji?: string | null
  position: number
  permissions: string
  managed: boolean
  mentionable: boolean
  tags?: RoleTags
  flags: number
}

export interface RoleTags {
  botId?: string
  integrationId?: string
  premiumSubscriber?: null
  subscriptionListingId?: string
  availableForPurchase?: null
  guildConnections?: null
}

export const DefaultMessageNotificationLevel = {
  ALL_MESSAGES: 0,
  ONLY_MENTIONS: 1
} as const

export const ExplicitContentFilterLevel = {
  DISABLED: 0,
  MEMBERS_WITHOUT_ROLES: 1,
  ALL_MEMBERS: 2
} as const

export const MFALevel = {
  NONE: 0,
  ELEVATED: 1
} as const

export const VerificationLevel = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4
} as const

export const GuildNSFWLevel = {
  DEFAULT: 0,
  EXPLICIT: 1,
  SAFE: 2,
  AGE_RESTRICTED: 3
} as const

export const PremiumTier = {
  NONE: 0,
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3
} as const

export const SystemChannelFlag = {
  SUPPRESS_JOIN_NOTIFICATIONS: 1 << 0,
  SUPPRESS_PREMIUM_SUBSCRIPTIONS: 1 << 1,
  SUPPRESS_GUILD_REMINDER_NOTIFICATIONS: 1 << 2,
  SUPPRESS_JOIN_NOTIFICATION_REPLIES: 1 << 3,
  SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATIONS: 1 << 4,
  SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATION_REPLIES: 1 << 5
} as const

export const GuildMemberFlag = {
  DID_REJOIN: 1 << 0,
  COMPLETED_ONBOARDING: 1 << 1,
  BYPASSES_VERIFICATION: 1 << 2,
  STARTED_ONBOARDING: 1 << 3,
  IS_GUEST: 1 << 4,
  STARTED_HOME_ACTIONS: 1 << 5,
  COMPLETED_HOME_ACTIONS: 1 << 6,
  AUTOMOD_QUARANTINED_USERNAME: 1 << 7,
  DM_SETTINGS_UPSELL_ACKNOWLEDGED: 1 << 9,
  AUTOMOD_QUARANTINED_GUILD_TAG: 1 << 10
} as const