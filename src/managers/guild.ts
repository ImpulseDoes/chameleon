import { BaseManager } from './base.js'
import { buildGuild, buildChannel } from '../builders/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'

export class GuildManager extends BaseManager<Guild> {

  protected storeKey = 'guilds' as const
  protected endpoint(id: string) { return `/guilds/${id}` }
  protected build = buildGuild

  async fetchChannels(guildId: string): Promise<ChameleonAPIResult<Channel[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/channels`)
    
    if (!result.ok) return result

    const channels = result.data.map(raw => buildChannel(raw as Record<string, unknown>, guildId))
    
    for (const c of channels) {
      this.store.channels.set(c.id, c)
    }

    return { ok: true, data: channels }
  }
}