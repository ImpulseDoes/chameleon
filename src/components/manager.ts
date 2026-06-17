import type { Client } from '../client/client.js'
import { ComponentContext } from './context.js'
import { buildUser, buildChannel, resolveChannel } from '../builders/index.js'
import type { ComponentHandler } from '../commands/manager.js'

export class ComponentManager {

  private handlers = new Map<string, ComponentHandler>()
  private regexHandlers: ComponentHandler[] = []

  constructor(private client: Client) {}

  public register(...components: ComponentHandler[]): void {

    for (const comp of components) {

      if (comp.customId && typeof comp.customId === 'string') {
        this.handlers.set(comp.customId, comp)
      } else if (comp.customId instanceof RegExp) {
        this.regexHandlers.push(comp)
      }
    }
  }

  public async handleInteraction(raw: Record<string, unknown>): Promise<void> {

    const data = raw.data as Record<string, unknown> | undefined
    if (!data) return

    const customId = data.custom_id as string
    if (!customId) return

    const handler = this.handlers.get(customId) ?? this.regexHandlers.find(candidate => {
      
      if (!(candidate.customId instanceof RegExp)) return false
      
      candidate.customId.lastIndex = 0
      
      return candidate.customId.test(customId)
    })
    
    if (!handler || !handler.execute) return

    const userRaw = (raw.member as Record<string, unknown> | undefined)?.user ?? raw.user
    const user = buildUser(userRaw as Record<string, unknown>)

    let guild
    if (raw.guild_id) {
      guild = this.client.cache.guilds.get(raw.guild_id as string) ?? { id: raw.guild_id as string }
    }

    let channel
    if (raw.channel_id) {
      channel = resolveChannel(raw.channel_id as string, this.client) ?? { id: raw.channel_id as string }
    }

    // Hydrate members from resolved data for select menus
    const resolved = data.resolved as Record<string, Record<string, Record<string, unknown>>> | undefined

    if (resolved?.members && resolved?.users && raw.guild_id) {

      for (const [id] of Object.entries(resolved.members)) {

        const userData = resolved.users[id]

        if (userData) {
          const u = buildUser(userData)
          this.client.cache.users.set(u.id, u)
        }
      }
    }

    const ctx = new ComponentContext(this.client, raw, user, guild, channel)

    if (handler.type === 'user_select' && resolved?.users) {
      ctx.values = (ctx.values as string[]).map((id: string) => {
        const uData = resolved.users![id]
        return uData ? buildUser(uData) : { id }
      }) as typeof ctx.values
    } else if (handler.type === 'role_select' && resolved?.roles) {
      ctx.values = (ctx.values as string[]).map((id: string) => {
        const roleData = resolved.roles![id]
        return roleData ? roleData : { id }
      }) as typeof ctx.values
    } else if (handler.type === 'channel_select' && resolved?.channels) {
      ctx.values = (ctx.values as string[]).map((id: string) => {
        const cData = resolved.channels![id]
        return cData ? buildChannel(cData, raw.guild_id as string | undefined) : { id }
      }) as typeof ctx.values
    } else if (handler.type === 'mentionable_select') {
      ctx.values = (ctx.values as string[]).map((id: string) => {
        const uData = resolved?.users?.[id]
        if (uData) return buildUser(uData)
        const roleData = resolved?.roles?.[id]
        return roleData ? roleData : { id }
      }) as typeof ctx.values
    }

    try {
      await handler.execute(ctx)
    } catch (err) {
      console.error(`[COMPONENTS] Error executing component ${customId}:`, err)
      if (!ctx.replied && !ctx.deferred) {
        await ctx.reply({ content: 'This interaction failed.', ephemeral: true }).catch(() => {})
      }
    }
  }
}