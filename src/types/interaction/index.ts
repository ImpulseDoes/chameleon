import type { User } from '../user/index.js'
import type { Member, Role, Guild } from '../guild/index.js'
import type { Message, Attachment, Embed } from '../message/index.js'
import type { Channel } from '../channel/index.js'
import type { MessageComponent } from '../components/index.js'
import type { Entitlement } from '../entitlement/index.js'

export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
} as const

export const InteractionContextType = {
  GUILD: 0,
  BOT_DM: 1,
  PRIVATE_CHANNEL: 2
} as const

export const InteractionCallbackType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
  LAUNCH_ACTIVITY: 12
} as const

export interface ResolvedData {
  users?: Record<string, User>
  members?: Record<string, Partial<Member>>
  roles?: Record<string, Role>
  channels?: Record<string, Partial<Channel>>
  messages?: Record<string, Partial<Message>>
  attachments?: Record<string, Attachment>
}

export interface ApplicationCommandInteractionDataOption {
  name: string
  type: number
  value?: string | number | boolean
  options?: ApplicationCommandInteractionDataOption[]
  focused?: boolean
}

export interface ApplicationCommandData {
  id: string
  name: string
  type: number
  resolved?: ResolvedData
  options?: ApplicationCommandInteractionDataOption[]
  guildId?: string
  targetId?: string
}

export interface MessageComponentData {
  customId: string
  componentType: number
  values?: string[]
  resolved?: ResolvedData
}

export interface ModalSubmitData {
  customId: string
  components: MessageComponent[]
}

export type InteractionData = ApplicationCommandData | MessageComponentData | ModalSubmitData

export interface Interaction {
  id: string
  applicationId: string
  type: number
  data?: InteractionData
  guild?: Partial<Guild>
  guildId?: string
  channel?: Partial<Channel>
  channelId?: string
  member?: Member
  user?: User
  token: string
  version: number
  message?: Message
  appPermissions?: string
  locale?: string
  guildLocale?: string
  entitlements: Entitlement[]
  authorizingIntegrationOwners: Record<string, string>
  context?: number
}

export interface MessageInteraction {
  id: string
  type: number
  name: string
  user: User
  member?: Partial<Member>
}

export interface AllowedMentions {
  parse?: string[]
  roles?: string[]
  users?: string[]
  repliedUser?: boolean
}

export interface InteractionCallbackData {
  tts?: boolean
  content?: string
  embeds?: Embed[]
  allowedMentions?: AllowedMentions
  flags?: number
  components?: MessageComponent[]
  attachments?: Partial<Attachment>[]
}

export interface AutocompleteCallbackData {
  choices: ApplicationCommandOptionChoice[]
}

export interface ApplicationCommandOptionChoice {
  name: string
  nameLocalizations?: Record<string, string>
  value: string | number
}

export interface ModalCallbackData {
  customId: string
  title: string
  components: MessageComponent[]
}

export interface InteractionResponse {
  type: number
  data?: InteractionCallbackData | AutocompleteCallbackData | ModalCallbackData
}