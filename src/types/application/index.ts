import type { User } from '../user/index.js'
import type { Guild } from '../guild/index.js'

export const ApplicationFlag = {
  APPLICATION_AUTO_MODERATION_RULE_CREATE_BADGE: 1 << 6,
  GATEWAY_PRESENCE: 1 << 12,
  GATEWAY_PRESENCE_LIMITED: 1 << 13,
  GATEWAY_GUILD_MEMBERS: 1 << 14,
  GATEWAY_GUILD_MEMBERS_LIMITED: 1 << 15,
  VERIFICATION_PENDING_GUILD_LIMIT: 1 << 16,
  EMBEDDED: 1 << 17,
  GATEWAY_MESSAGE_CONTENT: 1 << 18,
  GATEWAY_MESSAGE_CONTENT_LIMITED: 1 << 19,
  APPLICATION_COMMAND_BADGE: 1 << 23
} as const

export interface TeamMember {
  membershipState: number
  permissions: string[]
  teamId: string
  user: Partial<User>
}

export interface Team {
  icon: string | null
  id: string
  members: TeamMember[]
  name: string
  ownerUserId: string
}

export interface InstallParams {
  scopes: string[]
  permissions: string
}

export const ApplicationIntegrationType = {
  GUILD_INSTALL: 0,
  USER_INSTALL: 1
} as const

export interface ApplicationIntegrationTypeConfiguration {
  oauth2InstallParams?: InstallParams
}

export const ApplicationEventWebhookStatus = {
  DISABLED: 1,
  ENABLED: 2,
  DISABLED_BY_DISCORD: 3
} as const

export interface Application {
  id: string
  name: string
  icon: string | null
  description: string
  rpcOrigins?: string[]
  botPublic: boolean
  botRequireCodeGrant: boolean
  bot?: Partial<User>
  termsOfServiceUrl?: string
  privacyPolicyUrl?: string
  owner?: Partial<User>
  verifyKey: string
  team: Team | null
  guildId?: string
  guild?: Partial<Guild>
  primarySkuId?: string
  slug?: string
  coverImage?: string
  flags?: number
  approximateGuildCount?: number
  approximateUserInstallCount?: number
  approximateUserAuthorizationCount?: number
  redirectUris?: string[]
  interactionsEndpointUrl?: string | null
  roleConnectionsVerificationUrl?: string | null
  eventWebhooksUrl?: string | null
  eventWebhooksStatus?: number
  eventWebhooksTypes?: string[]
  tags?: string[]
  installParams?: InstallParams
  integrationTypesConfig?: Record<string, ApplicationIntegrationTypeConfiguration>
  customInstallUrl?: string
}

export const ActivityLocationKind = {
  GUILD_CHANNEL: 'gc',
  PRIVATE_CHANNEL: 'pc'
} as const

export interface ActivityLocation {
  id: string
  kind: string
  channelId: string
  guildId?: string
}

export interface ActivityInstance {
  applicationId: string
  instanceId: string
  launchId: string
  location: ActivityLocation
  users: string[]
}

export const ApplicationRoleConnectionMetadataType = {
  INTEGER_LESS_THAN_OR_EQUAL: 1,
  INTEGER_GREATER_THAN_OR_EQUAL: 2,
  INTEGER_EQUAL: 3,
  INTEGER_NOT_EQUAL: 4,
  DATETIME_LESS_THAN_OR_EQUAL: 5,
  DATETIME_GREATER_THAN_OR_EQUAL: 6,
  BOOLEAN_EQUAL: 7,
  BOOLEAN_NOT_EQUAL: 8
} as const

export interface ApplicationRoleConnectionMetadata {
  type: number
  key: string
  name: string
  nameLocalizations?: Record<string, string>
  description: string
  descriptionLocalizations?: Record<string, string>
}

export const ApplicationCommandType = {
  CHAT_INPUT: 1,
  USER: 2,
  MESSAGE: 3,
  PRIMARY_ENTRY_POINT: 4
} as const

export const ApplicationCommandOptionType = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11
} as const

export interface ApplicationCommandOptionChoice {
  name: string
  nameLocalizations?: Record<string, string>
  value: string | number
}

export interface ApplicationCommandOption {
  type: number
  name: string
  nameLocalizations?: Record<string, string>
  description: string
  descriptionLocalizations?: Record<string, string>
  required?: boolean
  choices?: ApplicationCommandOptionChoice[]
  options?: ApplicationCommandOption[]
  channelTypes?: number[]
  minValue?: number
  maxValue?: number
  minLength?: number
  maxLength?: number
  autocomplete?: boolean
}

export interface ApplicationCommand {
  id: string
  type?: number
  applicationId: string
  guildId?: string
  name: string
  nameLocalizations?: Record<string, string> | null
  description: string
  descriptionLocalizations?: Record<string, string> | null
  options?: ApplicationCommandOption[]
  defaultMemberPermissions: string | null
  dmPermission?: boolean
  defaultPermission?: boolean | null
  nsfw?: boolean
  version: string
  integrationTypes?: number[]
  contexts?: number[]
}

export interface ApplicationCommandPermission {
  id: string
  type: number
  permission: boolean
}

export interface GuildApplicationCommandPermissions {
  id: string
  applicationId: string
  guildId: string
  permissions: ApplicationCommandPermission[]
}