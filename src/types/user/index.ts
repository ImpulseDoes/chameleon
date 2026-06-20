import type { Integration } from '../integration/index.js'

export interface AvatarDecorationData {
  asset: string
  skuId: string
}

export interface Nameplate {
  skuId: string
  asset: string
  label: string
  palette: string[]
}

export interface Collectibles {
  nameplate?: Nameplate
}

export interface UserPrimaryGuild {
  identityGuildId: string | null
  identityEnabled: boolean | null
  tag: string | null
  badge: string | null
}

export interface User {
  id: string
  username: string
  discriminator: string
  globalName: string | null
  avatar: string | null
  bot?: boolean
  system?: boolean
  mfaEnabled?: boolean
  banner?: string | null
  accentColor?: number | null
  locale?: string
  verified?: boolean
  email?: string | null
  flags?: number
  premiumType?: number
  publicFlags?: number
  avatarDecorationData?: AvatarDecorationData | null
  collectibles?: Collectibles | null
  primaryGuild?: UserPrimaryGuild | null
}

export interface Connection {
  id: string
  name: string
  type: string
  revoked?: boolean
  integrations?: Integration[]
  verified: boolean
  friendSync: boolean
  showActivity: boolean
  twoWayLink: boolean
  visibility: number
}

export interface ApplicationRoleConnection {
  platformName?: string | null
  metadata: Record<string, string>
}


export const UserFlag = {
  STAFF: 1 << 0,
  PARTNER: 1 << 1,
  HYPESQUAD: 1 << 2,
  BUG_HUNTER_LEVEL_1: 1 << 3,
  HYPESQUAD_ONLINE_HOUSE_1: 1 << 6,
  HYPESQUAD_ONLINE_HOUSE_2: 1 << 7,
  HYPESQUAD_ONLINE_HOUSE_3: 1 << 8,
  PREMIUM_EARLY_SUPPORTER: 1 << 9,
  TEAM_PSEUDO_USER: 1 << 10,
  BUG_HUNTER_LEVEL_2: 1 << 14,
  VERIFIED_BOT: 1 << 16,
  VERIFIED_DEVELOPER: 1 << 17,
  CERTIFIED_MODERATOR: 1 << 18,
  BOT_HTTP_INTERACTIONS: 1 << 19
} as const

export const PremiumType = {
  NONE: 0,
  NITRO_CLASSIC: 1, // older users have it / user that got a classic sub, nowdays not used
  NITRO: 2,
  NITRO_BASIC: 3
} as const

export const VisibilityType = {
  NONE: 0,
  EVERYONE: 1
} as const