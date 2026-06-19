import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildEmoji } from '../builders/index.js'
import type { Emoji } from '../types/expressions/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class EmojiManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  async list(guildId: string): Promise<ChameleonAPIResult<Emoji[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/emojis`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const emojis = (result.data as Record<string, unknown>[]).map(e => {
      const emoji = buildEmoji(e)
      this.store.emojis.set(emoji.id!, emoji)
      return emoji
    })

    return { ok: true, data: emojis }
  }

  async fetch(guildId: string, emojiId: string): Promise<ChameleonAPIResult<Emoji>> {
    
    const cached = this.store.emojis.get(emojiId)
    
    if (cached) return { ok: true, data: cached }

    const result = await this.rest.get<unknown>(`/guilds/${guildId}/emojis/${emojiId}`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const emoji = buildEmoji(result.data as Record<string, unknown>)
    
    this.store.emojis.set(emoji.id!, emoji)
    
    return { ok: true, data: emoji }
  }

  async create(guildId: string, payload: { name: string, image: string, roles?: string[] }, reason?: string): Promise<ChameleonAPIResult<Emoji>> {
    
    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/emojis`, toSnakeCase(payload), headers)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const emoji = buildEmoji(result.data as Record<string, unknown>)
    
    this.store.emojis.set(emoji.id!, emoji)
    
    return { ok: true, data: emoji }
  }

  async edit(guildId: string, emojiId: string, payload: { name?: string, roles?: string[] }, reason?: string): Promise<ChameleonAPIResult<Emoji>> {
    
    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.patch<unknown>(`/guilds/${guildId}/emojis/${emojiId}`, toSnakeCase(payload), headers)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const emoji = buildEmoji(result.data as Record<string, unknown>)
    
    this.store.emojis.set(emoji.id!, emoji)
    
    return { ok: true, data: emoji }
  }

  async delete(guildId: string, emojiId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.delete(`/guilds/${guildId}/emojis/${emojiId}`, headers)
    
    if (result.ok) this.store.emojis.delete(emojiId)
    
    return result as ChameleonAPIResult<void>
  }
}