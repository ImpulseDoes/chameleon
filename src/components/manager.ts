import type { Client } from '../client/client.js'
import { ComponentContext } from './context.js'
import { buildUser, buildChannel, resolveChannel } from '../builders/index.js'

export class ComponentManager {

  private handlers = new Map<string, any>()

  constructor(private client: Client) {}

  public register(...components: any[]): void {

    for (const comp of components) {
      
      if (comp.customId) {
        this.handlers.set(comp.customId, comp)
      }
    }
  }

  public async handleInteraction(raw: Record<string, any>): Promise<void> {

    const data = raw.data as Record<string, any>
    const customId = data.custom_id as string
    
    if (!customId) return

    const handler = this.handlers.get(customId)
    if (!handler || !handler.execute) return

    const user = buildUser(raw.user ?? raw.member?.user)
    
    let guild
    if (raw.guild_id) {
      guild = this.client.cache.guilds.get(raw.guild_id) ?? { id: raw.guild_id }
    }
    
    let channel
    if (raw.channel_id) {
      channel = resolveChannel(raw.channel_id, this.client.cache) ?? { id: raw.channel_id }
    }

    // Hydrate members from resolved data for select menus
    if (data.resolved?.members && data.resolved?.users && raw.guild_id) {
      for (const [id, memberData] of Object.entries(data.resolved.members as Record<string, any>)) {

        const userData = (data.resolved.users as Record<string, any>)[id]
        
        if (userData) {
          const mergedMember = { ...memberData, user: userData }
          const u = buildUser(userData)
          this.client.cache.users.set(u.id, u)
        }
      }
    }

    const ctx = new ComponentContext(this.client, raw, user, guild, channel)

    if (handler.type === 'user_select' && data.resolved?.users) {
      ctx.values = ctx.values.map((id: string) => {
        const uData = (data.resolved!.users as Record<string, any>)[id]
        return uData ? buildUser(uData) : { id }
      })
    } else if (handler.type === 'channel_select' && data.resolved?.channels) {
      ctx.values = ctx.values.map((id: string) => {
        const cData = (data.resolved!.channels as Record<string, any>)[id]
        return cData ? buildChannel(cData, raw.guild_id) : { id }
      })
    }

    try {
      await handler.execute(ctx)
    } catch (err) {
      console.error(`[COMPONENTS] Error executing component ${customId}:`, err)
    }
  }
}