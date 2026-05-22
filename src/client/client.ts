import { TongueStore, type StoreOptions } from './store.ts'
import { ChameleonREST } from '../rest/index.ts'
import { ChameleonGateway, type GatewayPayload } from '../gateway/index.ts'
import type { ChameleonEvent } from '../events/index.ts'
import type { User } from '../types/user/index.ts'
import { IntentBits, type IntentResolvable } from '../types/types.ts'
import {
  buildUser, buildChannel, buildGuild, buildRole, buildMember, buildMessage,
  resolveChannel
} from '../builders/index.ts'
import { CommandManager } from '../commands/index.ts'

export interface ClientOptions<TIntents extends readonly IntentResolvable[]> {
  token: string
  intents: TIntents
  largeThreshold?: number
  sharding?: 'auto' | { shards: number[]; total: number }
  cluster?: boolean
  cache?: StoreOptions
  debug?: boolean
}

type EventMap = {
  [K in ChameleonEvent['type']]: Extract<ChameleonEvent, { type: K }>
}

export type MiddlewareFn = (event: ChameleonEvent, next: () => void) => void | Promise<void>

export class Client<TIntents extends readonly IntentResolvable[] = readonly IntentResolvable[]> {

  public token: string
  public intents: number
  public cache: TongueStore
  public rest: ChameleonREST
  public gateways: Map<number, ChameleonGateway> = new Map()
  public gateway: ChameleonGateway
  public user: User | null = null
  public debug: boolean
  public commands: CommandManager

  private listeners: Map<string, Array<(data: unknown) => void>> = new Map()
  private middlewares: MiddlewareFn[] = []

  constructor(options: ClientOptions<TIntents>) {

    this.token = options.token
    this.intents = this.resolveIntents(options.intents)
    this.debug = options.debug ?? false

    this.cache = new TongueStore(options.cache)
    this.rest = new ChameleonREST({ token: this.token })
    this.commands = new CommandManager(this)
    
    // detect sharding from environment if 'auto'
    let shards: number[] = [0]
    let totalShards = 1

    if (options.sharding === 'auto') {
      if (process.env.SHARD_LIST && process.env.TOTAL_SHARDS) {
        shards = process.env.SHARD_LIST.split(',').map(Number)
        totalShards = Number(process.env.TOTAL_SHARDS)
      } else if (process.env.SHARD_ID !== undefined && process.env.SHARD_COUNT !== undefined) {
        shards = [Number(process.env.SHARD_ID)]
        totalShards = Number(process.env.SHARD_COUNT)
      }
    } else if (typeof options.sharding === 'object') {
      shards = options.sharding.shards
      totalShards = options.sharding.total
    }

    for (const shardId of shards) {
      const gatewayOptions: import('../gateway/index.ts').ChameleonGatewayOptions = {
        token: this.token,
        intents: this.intents,
        ...(options.sharding ? { shard: [shardId, totalShards] } : {})
      }

      if (options.largeThreshold !== undefined) {
        gatewayOptions.largeThreshold = options.largeThreshold
      }

      const gw = new ChameleonGateway(gatewayOptions)
      this.gateways.set(shardId, gw)
    }

    this.gateway = this.gateways.get(shards[0] as number)!
    this.setupGateway()
  }

  private resolveIntents(intents: IntentResolvable | IntentResolvable[]): number {
    if (!Array.isArray(intents)) {
      intents = [intents]
    }
    
    let resolved = 0
    for (const intent of intents) {
      if (typeof intent === 'number') {
        resolved |= intent
      } else if (typeof intent === 'string') {
        const bit = IntentBits[intent as keyof typeof IntentBits]
        if (bit !== undefined) {
          resolved |= bit
        }
      } else if (Array.isArray(intent)) {
        resolved |= this.resolveIntents(intent)
      }
    }
    return resolved
  }

  /**
   * register an event listener with full type-safety via discriminated unions
   */
  public on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this {

    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    this.listeners.get(event)!.push(listener as (data: unknown) => void)

    return this
  }

  /**
   * register middleware that runs between dispatch and event handlers
   */
  public use(fn: MiddlewareFn): this {
    this.middlewares.push(fn)
    return this
  }

  /**
   * Connect to all Gateways
   */
  public async login(): Promise<void> {

    for (const gw of this.gateways.values()) {
      gw.connect()
      // delay connection between shards as recommended by Discord
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  /**
   * Gracefully disconnect from all Gateways
   */
  public destroy(): void {
    for (const gw of this.gateways.values()) {
      gw.disconnect(1000, 'Client destroyed')
    }
  }

  /**
   * dispatch an event through the middleware pipeline, then to listeners
   */
  private dispatch<K extends keyof EventMap>(event: K, data: EventMap[K]): void {

    if (this.middlewares.length === 0) {
      this.emit(event, data)
      return
    }

    let index = 0

    const next = (): void => {
      index++

      if (index >= this.middlewares.length) {
        this.emit(event, data)
        return
      }

      const mw = this.middlewares[index]
      if (mw) mw(data, next)
    }

    const first = this.middlewares[0]
    if (first) first(data, next)
  }

  /**
   * emit to registered listeners
   */
  private emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {

    const handlers = this.listeners.get(event)
    
    if (!handlers) return
    
    for (const handler of handlers) {
      handler(data)
    }
  }

  private setupGateway(): void {

    for (const gw of this.gateways.values()) {
      gw.on<GatewayPayload>('dispatch', (payload) => {
        this.handleDispatch(payload)
      })
    }
  }

  private handleDispatch(payload: GatewayPayload): void {

    const { t } = payload
    const d = payload.d as Record<string, unknown>
    
    if (!t || !d) return

    switch (t) {

      case 'READY': {
        if (d.user) {
          this.user = buildUser(d.user as Record<string, unknown>)
          this.cache.users.set(this.user.id, this.user)
        }
        this.dispatch('READY', { type: 'READY' })
        break
      }

      case 'RESUMED': {
        this.dispatch('RESUMED', { type: 'RESUMED' })
        break
      }

      case 'GUILD_CREATE': {

        const guild = buildGuild(d)
        
        this.cache.guilds.set(guild.id, guild)

        if (Array.isArray(d.channels)) {
          for (const raw of d.channels as Record<string, unknown>[]) {
            const ch = buildChannel(raw, guild.id)
            this.cache.channels.set(ch.id, ch)
          }
        }
        if (Array.isArray(d.roles)) {
          for (const raw of d.roles as Record<string, unknown>[]) {
            const role = buildRole(raw)
            this.cache.roles.set(role.id, role)
          }
        }
        if (Array.isArray(d.members)) {
          for (const raw of d.members as Record<string, unknown>[]) {
            const member = buildMember(raw, guild.id, this.cache)
            if (member.user?.id) {
              this.cache.members.set(TongueStore.memberKey(guild.id, member.user.id), member)
            }
          }
        }

        this.dispatch('GUILD_CREATE', { type: 'GUILD_CREATE', guild })
        break
      }

      case 'GUILD_UPDATE': {
        const oldGuild = this.cache.guilds.get(d.id as string)
        const guild = buildGuild(d)
        this.cache.guilds.set(guild.id, guild)
        this.dispatch('GUILD_UPDATE', { type: 'GUILD_UPDATE', guild, ...(oldGuild ? { oldGuild } : {}) })
        break
      }

      case 'GUILD_DELETE': {
        const guildId = d.id as string
        const unavailable = d.unavailable as boolean | undefined
        if (!unavailable) {
          this.cache.guilds.delete(guildId)
        }
        this.dispatch('GUILD_DELETE', { type: 'GUILD_DELETE', guildId, ...(unavailable !== undefined ? { unavailable } : {}) })
        break
      }

      case 'CHANNEL_CREATE': {
        const channel = buildChannel(d)
        this.cache.channels.set(channel.id, channel)
        this.dispatch('CHANNEL_CREATE', { type: 'CHANNEL_CREATE', channel, ...(d.guild_id ? { guild: { id: d.guild_id as string } } : {}) })
        break
      }

      case 'CHANNEL_UPDATE': {
        const oldChannel = this.cache.channels.get(d.id as string)
        const channel = buildChannel(d)
        this.cache.channels.set(channel.id, channel)
        this.dispatch('CHANNEL_UPDATE', { type: 'CHANNEL_UPDATE', channel, ...(oldChannel ? { oldChannel } : {}), ...(d.guild_id ? { guild: { id: d.guild_id as string } } : {}) })
        break
      }

      case 'CHANNEL_DELETE': {
        const channelId = d.id as string
        this.cache.channels.delete(channelId)
        this.dispatch('CHANNEL_DELETE', { type: 'CHANNEL_DELETE', channelId, ...(d.guild_id ? { guild: { id: d.guild_id as string } } : {}) })
        break
      }

      case 'CHANNEL_PINS_UPDATE': {
        this.dispatch('CHANNEL_PINS_UPDATE', {
          type: 'CHANNEL_PINS_UPDATE',
          channelId: d.channel_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          ...(d.last_pin_timestamp !== undefined ? { lastPinTimestamp: d.last_pin_timestamp ? Date.parse(d.last_pin_timestamp as string) : null } : {})
        })
        break
      }

      case 'THREAD_CREATE': {
        const channel = buildChannel(d)
        this.cache.channels.set(channel.id, channel)
        this.dispatch('THREAD_CREATE', { type: 'THREAD_CREATE', channel })
        break
      }

      case 'THREAD_UPDATE': {
        const oldChannel = this.cache.channels.get(d.id as string)
        const channel = buildChannel(d)
        this.cache.channels.set(channel.id, channel)
        this.dispatch('THREAD_UPDATE', { type: 'THREAD_UPDATE', channel, ...(oldChannel ? { oldChannel } : {}) })
        break
      }

      case 'THREAD_DELETE': {
        const id = d.id as string
        this.cache.channels.delete(id)
        this.dispatch('THREAD_DELETE', {
          type: 'THREAD_DELETE',
          id,
          guildId: d.guild_id as string,
          parentId: d.parent_id as string,
          channelType: d.type as number
        })
        break
      }

      case 'GUILD_MEMBER_ADD': {
        const guildId = d.guild_id as string
        const member = buildMember(d, guildId, this.cache)
        if (member.user?.id) {
          this.cache.members.set(TongueStore.memberKey(guildId, member.user.id), member)
        }
        this.dispatch('GUILD_MEMBER_ADD', { type: 'GUILD_MEMBER_ADD', member, guildId })
        break
      }

      case 'GUILD_MEMBER_UPDATE': {
        const guildId = d.guild_id as string
        const rawUser = d.user as Record<string, unknown>
        const user = buildUser(rawUser)
        this.cache.users.set(user.id, user)
        const oldMember = this.cache.members.get(TongueStore.memberKey(guildId, user.id))
        this.dispatch('GUILD_MEMBER_UPDATE', {
          type: 'GUILD_MEMBER_UPDATE',
          guildId,
          user,
          roles: d.roles as string[],
          ...(oldMember ? { oldMember } : {}),
          ...(d.nick !== undefined ? { nick: (d.nick as string | null) ?? null } : {}),
          ...(d.joined_at !== undefined ? { joinedAt: d.joined_at ? Date.parse(d.joined_at as string) : null } : {})
        })
        break
      }

      case 'GUILD_MEMBER_REMOVE': {
        const guildId = d.guild_id as string
        const rawUser = d.user as Record<string, unknown>
        const user = buildUser(rawUser)
        this.cache.members.delete(TongueStore.memberKey(guildId, user.id))
        this.dispatch('GUILD_MEMBER_REMOVE', { type: 'GUILD_MEMBER_REMOVE', user, guildId })
        break
      }

      case 'GUILD_ROLE_CREATE': {
        const role = buildRole(d.role as Record<string, unknown>)
        this.cache.roles.set(role.id, role)
        this.dispatch('GUILD_ROLE_CREATE', { type: 'GUILD_ROLE_CREATE', guildId: d.guild_id as string, role })
        break
      }

      case 'GUILD_ROLE_UPDATE': {
        const rolePayload = d.role as Record<string, unknown>
        const oldRole = this.cache.roles.get(rolePayload.id as string)
        const role = buildRole(rolePayload)
        this.cache.roles.set(role.id, role)
        this.dispatch('GUILD_ROLE_UPDATE', { type: 'GUILD_ROLE_UPDATE', guildId: d.guild_id as string, role, ...(oldRole ? { oldRole } : {}) })
        break
      }

      case 'GUILD_ROLE_DELETE': {
        const roleId = d.role_id as string
        this.cache.roles.delete(roleId)
        this.dispatch('GUILD_ROLE_DELETE', { type: 'GUILD_ROLE_DELETE', guildId: d.guild_id as string, roleId })
        break
      }

      case 'GUILD_BAN_ADD': {
        const user = buildUser(d.user as Record<string, unknown>)
        this.dispatch('GUILD_BAN_ADD', { type: 'GUILD_BAN_ADD', guildId: d.guild_id as string, user })
        break
      }

      case 'GUILD_BAN_REMOVE': {
        const user = buildUser(d.user as Record<string, unknown>)
        this.dispatch('GUILD_BAN_REMOVE', { type: 'GUILD_BAN_REMOVE', guildId: d.guild_id as string, user })
        break
      }

      case 'MESSAGE_CREATE': {

        const message = buildMessage(d, this.cache)
        this.cache.messages.set(message.id, message)

        this.dispatch('MESSAGE_CREATE', {
          type: 'MESSAGE_CREATE',
          message,
          channel: resolveChannel(message.channelId, this.cache) as import('../events/index.ts').PartialChannel
        })
        break
      }

      case 'MESSAGE_UPDATE': {
        const oldMessage = this.cache.messages.get(d.id as string)
        const message = buildMessage(d, this.cache, oldMessage)
        this.cache.messages.set(message.id, message)
        this.dispatch('MESSAGE_UPDATE', {
          type: 'MESSAGE_UPDATE',
          message,
          channel: resolveChannel(message.channelId, this.cache) as import('../events/index.ts').PartialChannel,
          ...(oldMessage ? { oldMessage } : {})
        })
        break
      }

      case 'MESSAGE_DELETE': {
        const messageId = d.id as string
        const message = this.cache.messages.get(messageId)
        this.cache.messages.delete(messageId)
        this.dispatch('MESSAGE_DELETE', {
          type: 'MESSAGE_DELETE',
          messageId,
          channelId: d.channel_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          ...(message ? { message } : {})
        })
        break
      }

      case 'MESSAGE_DELETE_BULK': {
        const ids = d.ids as string[]
        const messages = []
        for (const id of ids) {
          const msg = this.cache.messages.get(id)
          if (msg) messages.push(msg)
          this.cache.messages.delete(id)
        }
        this.dispatch('MESSAGE_DELETE_BULK', {
          type: 'MESSAGE_DELETE_BULK',
          messageIds: ids,
          channelId: d.channel_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          ...(messages.length > 0 ? { messages } : {})
        })
        break
      }

      case 'MESSAGE_REACTION_ADD': {
        this.dispatch('MESSAGE_REACTION_ADD', {
          type: 'MESSAGE_REACTION_ADD',
          userId: d.user_id as string,
          channelId: d.channel_id as string,
          messageId: d.message_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          emoji: d.emoji as Partial<import('../types/expressions/index.ts').Emoji>,
          ...(d.member ? { member: buildMember(d.member as Record<string, unknown>, d.guild_id as string, this.cache) } : {})
        })
        break
      }

      case 'MESSAGE_REACTION_REMOVE': {
        this.dispatch('MESSAGE_REACTION_REMOVE', {
          type: 'MESSAGE_REACTION_REMOVE',
          userId: d.user_id as string,
          channelId: d.channel_id as string,
          messageId: d.message_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          emoji: d.emoji as Partial<import('../types/expressions/index.ts').Emoji>
        })
        break
      }

      case 'MESSAGE_REACTION_REMOVE_ALL': {
        this.dispatch('MESSAGE_REACTION_REMOVE_ALL', {
          type: 'MESSAGE_REACTION_REMOVE_ALL',
          channelId: d.channel_id as string,
          messageId: d.message_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {})
        })
        break
      }

      case 'MESSAGE_REACTION_REMOVE_EMOJI': {
        this.dispatch('MESSAGE_REACTION_REMOVE_EMOJI', {
          type: 'MESSAGE_REACTION_REMOVE_EMOJI',
          channelId: d.channel_id as string,
          messageId: d.message_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          emoji: d.emoji as Partial<import('../types/expressions/index.ts').Emoji>
        })
        break
      }

      case 'INTERACTION_CREATE': {
        this.commands.handleInteraction(d).catch(console.error)
        this.dispatch('INTERACTION_CREATE', {
          type: 'INTERACTION_CREATE',
          interaction: d as unknown as import('../types/interaction/index.ts').Interaction
        })
        break
      }

      case 'VOICE_STATE_UPDATE': {
        this.dispatch('VOICE_STATE_UPDATE', {
          type: 'VOICE_STATE_UPDATE',
          voiceState: d as unknown as import('../types/voice/index.ts').Voice
        })
        break
      }

      case 'VOICE_SERVER_UPDATE': {
        this.dispatch('VOICE_SERVER_UPDATE', {
          type: 'VOICE_SERVER_UPDATE',
          token: d.token as string,
          guildId: d.guild_id as string,
          endpoint: d.endpoint as string | null
        })
        break
      }

      case 'INVITE_CREATE': {
        this.dispatch('INVITE_CREATE', {
          type: 'INVITE_CREATE',
          channelId: d.channel_id as string,
          code: d.code as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          ...(d.inviter ? { inviter: buildUser(d.inviter as Record<string, unknown>) } : {}),
          maxAge: d.max_age as number,
          maxUses: d.max_uses as number,
          temporary: d.temporary as boolean
        })
        break
      }

      case 'INVITE_DELETE': {
        this.dispatch('INVITE_DELETE', {
          type: 'INVITE_DELETE',
          channelId: d.channel_id as string,
          code: d.code as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {})
        })
        break
      }

      case 'GUILD_INTEGRATIONS_UPDATE': {
        this.dispatch('GUILD_INTEGRATIONS_UPDATE', {
          type: 'GUILD_INTEGRATIONS_UPDATE',
          guildId: d.guild_id as string
        })
        break
      }

      case 'ENTITLEMENT_CREATE': {
        this.dispatch('ENTITLEMENT_CREATE', { type: 'ENTITLEMENT_CREATE', entitlement: d as unknown as import('../types/entitlement/index.ts').Entitlement })
        break
      }
      case 'ENTITLEMENT_UPDATE': {
        this.dispatch('ENTITLEMENT_UPDATE', { type: 'ENTITLEMENT_UPDATE', entitlement: d as unknown as import('../types/entitlement/index.ts').Entitlement })
        break
      }
      case 'ENTITLEMENT_DELETE': {
        this.dispatch('ENTITLEMENT_DELETE', { type: 'ENTITLEMENT_DELETE', entitlement: d as unknown as import('../types/entitlement/index.ts').Entitlement })
        break
      }

      case 'PRESENCE_UPDATE': {
        this.dispatch('PRESENCE_UPDATE', {
          type: 'PRESENCE_UPDATE',
          user: d.user as Partial<User> & { id: string },
          guildId: d.guild_id as string,
          status: d.status as string,
          activities: d.activities as unknown[],
          clientStatus: d.client_status as unknown
        })
        break
      }

      case 'TYPING_START': {
        this.dispatch('TYPING_START', {
          type: 'TYPING_START',
          channelId: d.channel_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          userId: d.user_id as string,
          timestamp: d.timestamp as number,
          ...(d.member ? { member: buildMember(d.member as Record<string, unknown>, d.guild_id as string, this.cache) } : {})
        })
        break
      }

      case 'USER_UPDATE': {
        const oldUser = this.cache.users.get(d.id as string)
        const user = buildUser(d)
        this.cache.users.set(user.id, user)
        if (this.user && user.id === this.user.id) {
          this.user = user
        }
        this.dispatch('USER_UPDATE', { type: 'USER_UPDATE', user, ...(oldUser ? { oldUser } : {}) })
        break
      }

      case 'WEBHOOKS_UPDATE': {
        this.dispatch('WEBHOOKS_UPDATE', {
          type: 'WEBHOOKS_UPDATE',
          guildId: d.guild_id as string,
          channelId: d.channel_id as string
        })
        break
      }

      case 'MESSAGE_POLL_VOTE_ADD': {
        this.dispatch('MESSAGE_POLL_VOTE_ADD', {
          type: 'MESSAGE_POLL_VOTE_ADD',
          userId: d.user_id as string,
          channelId: d.channel_id as string,
          messageId: d.message_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          answerId: d.answer_id as number
        })
        break
      }

      case 'MESSAGE_POLL_VOTE_REMOVE': {
        this.dispatch('MESSAGE_POLL_VOTE_REMOVE', {
          type: 'MESSAGE_POLL_VOTE_REMOVE',
          userId: d.user_id as string,
          channelId: d.channel_id as string,
          messageId: d.message_id as string,
          ...(d.guild_id ? { guildId: d.guild_id as string } : {}),
          answerId: d.answer_id as number
        })
        break
      }
    }
  }
}