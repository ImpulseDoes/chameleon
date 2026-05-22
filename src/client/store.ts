import { Tongue } from '../utils/tongue.ts'
import type { Guild, Member, Role } from '../types/guild/index.ts'
import type { Channel } from '../types/channel/index.ts'
import type { User } from '../types/user/index.ts'
import type { Message } from '../types/message/index.ts'

export interface StoreOptions {
  messages?: number
  users?: number
  members?: number
  guilds?: number
  roles?: number
  channels?: number
}

export class TongueStore {

  public guilds: Tongue<string, Guild>
  public roles: Tongue<string, Role>
  public channels: Tongue<string, Channel>
  public users: Tongue<string, User>
  public members: Tongue<string, Member>
  public messages: Tongue<string, Message>

  constructor(options?: StoreOptions) {
    this.guilds = new Tongue<string, Guild>(options?.guilds ?? Infinity)
    this.roles = new Tongue<string, Role>(options?.roles ?? Infinity)
    this.channels = new Tongue<string, Channel>(options?.channels ?? Infinity)
    this.members = new Tongue<string, Member>(options?.members ?? 1000)
    this.messages = new Tongue<string, Message>(options?.messages ?? 100)
    this.users = new Tongue<string, User>(options?.users ?? Infinity)
  }

  public static memberKey(guildId: string, userId: string): string {
    return `${guildId}_${userId}`
  }
}