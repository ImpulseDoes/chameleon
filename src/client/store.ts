import { Tongue } from '../utils/tongue.ts'
import type { Guild, Member, Role } from '../types/guild/index.ts'
import type { Channel } from '../types/channel/index.ts'
import type { User } from '../types/user/index.ts'
import type { Message } from '../types/message/index.ts'
import type { Emoji, Sticker } from '../types/expressions/index.ts'
import type { StageInstance } from '../types/stage/index.ts'
import type { GuildScheduledEvent } from '../types/scheduled/index.ts'
import type { AutoModerationRule } from '../types/automod/index.ts'
import type { Integration } from '../types/integration/index.ts'

export interface StoreOptions {
  messages?: number
  users?: number
  members?: number
  guilds?: number
  roles?: number
  channels?: number
  emojis?: number
  stickers?: number
  stageInstances?: number
  scheduledEvents?: number
  autoModRules?: number
  integrations?: number
}

export class TongueStore {

  public guilds: Tongue<string, Guild>
  public roles: Tongue<string, Role>
  public channels: Tongue<string, Channel>
  public users: Tongue<string, User>
  public members: Tongue<string, Member>
  public messages: Tongue<string, Message>
  public emojis: Tongue<string, Emoji>
  public stickers: Tongue<string, Sticker>
  public stageInstances: Tongue<string, StageInstance>
  public scheduledEvents: Tongue<string, GuildScheduledEvent>
  public autoModRules: Tongue<string, AutoModerationRule>
  public integrations: Tongue<string, Integration>

  constructor(options?: StoreOptions) {
    this.guilds = new Tongue<string, Guild>(options?.guilds ?? Infinity)
    this.roles = new Tongue<string, Role>(options?.roles ?? Infinity)
    this.channels = new Tongue<string, Channel>(options?.channels ?? Infinity)
    this.members = new Tongue<string, Member>(options?.members ?? 1000)
    this.messages = new Tongue<string, Message>(options?.messages ?? 100)
    this.users = new Tongue<string, User>(options?.users ?? Infinity)
    this.emojis = new Tongue<string, Emoji>(options?.emojis ?? Infinity)
    this.stickers = new Tongue<string, Sticker>(options?.stickers ?? Infinity)
    this.stageInstances = new Tongue<string, StageInstance>(options?.stageInstances ?? Infinity)
    this.scheduledEvents = new Tongue<string, GuildScheduledEvent>(options?.scheduledEvents ?? Infinity)
    this.autoModRules = new Tongue<string, AutoModerationRule>(options?.autoModRules ?? Infinity)
    this.integrations = new Tongue<string, Integration>(options?.integrations ?? Infinity)
  }

  public static memberKey(guildId: string, userId: string): string {
    return `${guildId}_${userId}`
  }
}