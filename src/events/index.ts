import type { Message } from '../types/message/index.js'
import type { Channel } from '../types/channel/index.js'
import type { Guild, Member, Role } from '../types/guild/index.js'
import type { User } from '../types/user/index.js'
import type { Interaction } from '../types/interaction/index.js'
import type { Voice } from '../types/voice/index.js'
import type { StageInstance } from '../types/stage/index.js'
import type { GuildScheduledEvent } from '../types/scheduled/index.js'
import type { AutoModerationRule, AutoModerationAction } from '../types/automod/index.js'
import type { Emoji } from '../types/expressions/index.js'
import type { Entitlement } from '../types/entitlement/index.js'
import type { Invite } from '../types/invite/index.js'
import type { Integration } from '../types/integration/index.js'

export type PartialChannel = Partial<Channel> & { id: string }
export type PartialGuild = Partial<Guild> & { id: string }

export type ChameleonEvent =
  | { type: 'READY' }
  | { type: 'RESUMED' }
  | { type: 'GUILD_CREATE'; guild: Guild; partial?: boolean }
  | { type: 'GUILD_AVAILABLE'; guild: Guild; reason: 'hydration' | 'outage'; partial?: boolean }
  | { type: 'GUILD_UNAVAILABLE'; guildId: string }
  | { type: 'GUILD_UPDATE'; oldGuild?: Guild; guild: Guild }
  | { type: 'GUILD_DELETE'; guildId: string }
  | { type: 'CHANNEL_CREATE'; channel: Channel; guild?: PartialGuild }
  | { type: 'CHANNEL_UPDATE'; oldChannel?: Channel; channel: Channel; guild?: PartialGuild }
  | { type: 'CHANNEL_DELETE'; channelId: string; guild?: PartialGuild }
  | { type: 'CHANNEL_PINS_UPDATE'; channelId: string; guildId?: string; lastPinTimestamp?: number | null }
  | { type: 'THREAD_CREATE'; channel: Channel }
  | { type: 'THREAD_UPDATE'; oldChannel?: Channel; channel: Channel }
  | { type: 'THREAD_DELETE'; id: string; guildId: string; parentId: string; channelType: number }
  | { type: 'THREAD_LIST_SYNC'; guildId: string; channelIds?: string[]; threads: Channel[]; members: unknown[] }
  | { type: 'GUILD_MEMBER_ADD'; member: Member; guildId: string }
  | { type: 'GUILD_MEMBER_UPDATE'; oldMember?: Member; guildId: string; user: User; roles: string[]; nick?: string | null; joinedAt?: number | null }
  | { type: 'GUILD_MEMBER_REMOVE'; user: User; guildId: string }
  | { type: 'GUILD_MEMBERS_CHUNK'; guildId: string; members: Member[]; chunkIndex: number; chunkCount: number; notFound?: string[]; nonce?: string }
  | { type: 'GUILD_ROLE_CREATE'; guildId: string; role: Role }
  | { type: 'GUILD_ROLE_UPDATE'; oldRole?: Role; guildId: string; role: Role }
  | { type: 'GUILD_ROLE_DELETE'; guildId: string; roleId: string }
  | { type: 'GUILD_BAN_ADD'; guildId: string; user: User }
  | { type: 'GUILD_BAN_REMOVE'; guildId: string; user: User }
  | { type: 'GUILD_EMOJIS_UPDATE'; guildId: string; emojis: Emoji[] }
  | { type: 'GUILD_STICKERS_UPDATE'; guildId: string; stickers: unknown[] }
  | { type: 'MESSAGE_CREATE'; message: Message; channel: PartialChannel }
  | { type: 'MESSAGE_UPDATE'; oldMessage?: Message; message: Message; channel: PartialChannel }
  | { type: 'MESSAGE_DELETE'; messageId: string; channelId: string; guildId?: string; message?: Message }
  | { type: 'MESSAGE_DELETE_BULK'; messageIds: string[]; channelId: string; guildId?: string; messages?: Message[] }
  | { type: 'MESSAGE_REACTION_ADD'; userId: string; channelId: string; messageId: string; guildId?: string; emoji: Partial<Emoji>; member?: Member }
  | { type: 'MESSAGE_REACTION_REMOVE'; userId: string; channelId: string; messageId: string; guildId?: string; emoji: Partial<Emoji> }
  | { type: 'MESSAGE_REACTION_REMOVE_ALL'; channelId: string; messageId: string; guildId?: string }
  | { type: 'MESSAGE_REACTION_REMOVE_EMOJI'; channelId: string; messageId: string; guildId?: string; emoji: Partial<Emoji> }
  | { type: 'INTERACTION_CREATE'; interaction: Interaction }
  | { type: 'VOICE_STATE_UPDATE'; voiceState: Voice }
  | { type: 'VOICE_SERVER_UPDATE'; token: string; guildId: string; endpoint: string | null }
  | { type: 'STAGE_INSTANCE_CREATE'; stageInstance: StageInstance }
  | { type: 'STAGE_INSTANCE_UPDATE'; stageInstance: StageInstance }
  | { type: 'STAGE_INSTANCE_DELETE'; stageInstance: StageInstance }
  | { type: 'GUILD_SCHEDULED_EVENT_CREATE'; scheduledEvent: GuildScheduledEvent }
  | { type: 'GUILD_SCHEDULED_EVENT_UPDATE'; scheduledEvent: GuildScheduledEvent }
  | { type: 'GUILD_SCHEDULED_EVENT_DELETE'; scheduledEvent: GuildScheduledEvent }
  | { type: 'GUILD_SCHEDULED_EVENT_USER_ADD'; guildScheduledEventId: string; userId: string; guildId: string }
  | { type: 'GUILD_SCHEDULED_EVENT_USER_REMOVE'; guildScheduledEventId: string; userId: string; guildId: string }
  | { type: 'AUTO_MODERATION_RULE_CREATE'; rule: AutoModerationRule }
  | { type: 'AUTO_MODERATION_RULE_UPDATE'; rule: AutoModerationRule }
  | { type: 'AUTO_MODERATION_RULE_DELETE'; rule: AutoModerationRule }
  | { type: 'AUTO_MODERATION_ACTION_EXECUTION'; guildId: string; action: AutoModerationAction; ruleId: string; ruleTriggerType: number; userId: string; channelId?: string; messageId?: string; content?: string; matchedKeyword?: string | null; matchedContent?: string | null }
  | { type: 'INVITE_CREATE'; channelId: string; code: string; guildId?: string; inviter?: User; maxAge: number; maxUses: number; temporary: boolean }
  | { type: 'INVITE_DELETE'; channelId: string; code: string; guildId?: string }
  | { type: 'GUILD_INTEGRATIONS_UPDATE'; guildId: string }
  | { type: 'INTEGRATION_CREATE'; guildId: string; integration: Integration }
  | { type: 'INTEGRATION_UPDATE'; guildId: string; integration: Integration }
  | { type: 'INTEGRATION_DELETE'; id: string; guildId: string; applicationId?: string }
  | { type: 'ENTITLEMENT_CREATE'; entitlement: Entitlement }
  | { type: 'ENTITLEMENT_UPDATE'; entitlement: Entitlement }
  | { type: 'ENTITLEMENT_DELETE'; entitlement: Entitlement }
  | { type: 'PRESENCE_UPDATE'; user: Partial<User> & { id: string }; guildId: string; status: string; activities: unknown[]; clientStatus: unknown }
  | { type: 'TYPING_START'; channelId: string; guildId?: string; userId: string; timestamp: number; member?: Member }
  | { type: 'USER_UPDATE'; oldUser?: User; user: User }
  | { type: 'WEBHOOKS_UPDATE'; guildId: string; channelId: string }
  | { type: 'MESSAGE_POLL_VOTE_ADD'; userId: string; channelId: string; messageId: string; guildId?: string; answerId: number }
  | { type: 'MESSAGE_POLL_VOTE_REMOVE'; userId: string; channelId: string; messageId: string; guildId?: string; answerId: number }

export type ChameleonEventHandler = (event: ChameleonEvent) => void | Promise<void>