import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildSticker } from '../builders/index.js'
import type { Sticker } from '../types/expressions/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class StickerManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  async list(guildId: string): Promise<ChameleonAPIResult<Sticker[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/stickers`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const stickers = (result.data as Record<string, unknown>[]).map(s => {
      const sticker = buildSticker(s)
      this.store.stickers.set(sticker.id, sticker)
      return sticker
    })
    
    return { ok: true, data: stickers }
  }

  async fetch(guildId: string, stickerId: string): Promise<ChameleonAPIResult<Sticker>> {

    const cached = this.store.stickers.get(stickerId)
    
    if (cached) return { ok: true, data: cached }

    const result = await this.rest.get<unknown>(`/guilds/${guildId}/stickers/${stickerId}`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const sticker = buildSticker(result.data as Record<string, unknown>)
    
    this.store.stickers.set(sticker.id, sticker)
    
    return { ok: true, data: sticker }
  }

  async create(guildId: string, payload: { name: string, description: string, tags: string, file: import('../builders/attachment.js').AttachmentBuilder }, reason?: string): Promise<ChameleonAPIResult<Sticker>> {
    
    const headers = createAuditLogHeaders(reason)

    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('description', payload.description)
    formData.append('tags', payload.tags)
    
    const blob = new Blob([new Uint8Array(payload.file.data)])
    formData.append('file', blob, payload.file.name)

    const result = await this.rest.post<unknown>(`/guilds/${guildId}/stickers`, formData, headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const sticker = buildSticker(result.data as Record<string, unknown>)
    this.store.stickers.set(sticker.id, sticker)
    
    return { ok: true, data: sticker }
  }

  async edit(guildId: string, stickerId: string, payload: { name?: string, description?: string, tags?: string }, reason?: string): Promise<ChameleonAPIResult<Sticker>> {
    
    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.patch<unknown>(`/guilds/${guildId}/stickers/${stickerId}`, toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const sticker = buildSticker(result.data as Record<string, unknown>)
    this.store.stickers.set(sticker.id, sticker)
    
    return { ok: true, data: sticker }
  }

  async delete(guildId: string, stickerId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.delete(`/guilds/${guildId}/stickers/${stickerId}`, headers)
    
    if (result.ok) this.store.stickers.delete(stickerId)
    
    return result as ChameleonAPIResult<void>
  }
}