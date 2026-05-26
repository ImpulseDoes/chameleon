import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildMessage, serializeComponent } from '../builders/index.js'
import type { Message, Embed } from '../types/message/index.js'
import type { MessageComponent } from '../types/components/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'

export type MessageCreateOptions = string | {
  content?: string
  embeds?: (Embed | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  components?: (MessageComponent | { build?(): MessageComponent } | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  reply?: { messageId: string, failIfNotExists?: boolean }
}

export class MessageManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  async fetch(channelId: string, messageId: string, force = false): Promise<ChameleonAPIResult<Message>> {

    if (!force) {
      
      const cached = this.store.messages.get(messageId)
      
      if (cached) return { ok: true, data: cached }
    }

    const result = await this.rest.get<unknown>(`/channels/${channelId}/messages/${messageId}`)
    if (!result.ok) return result

    const message = buildMessage(result.data as Record<string, unknown>, this.store)
    this.store.messages.set(message.id, message)

    return { ok: true, data: message }
  }

  async send(channelId: string, payload: MessageCreateOptions): Promise<ChameleonAPIResult<Message>> {

    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : { ...payload }

    if (typeof payload === 'object') {
      if (payload.embeds) {
        data.embeds = payload.embeds.map(e => (e && typeof (e as { toJSON?(): Record<string, unknown> }).toJSON === 'function' ? (e as { toJSON(): Record<string, unknown> }).toJSON() : e))
      }
      if (payload.components) {
        data.components = payload.components.map(c => serializeComponent(c))
      }
      if (payload.reply) {
        data.message_reference = { message_id: payload.reply.messageId, fail_if_not_exists: payload.reply.failIfNotExists ?? true }
        delete data.reply
      }
    }

    const result = await this.rest.post<unknown>(`/channels/${channelId}/messages`, data)

    if (!result.ok) return result as ChameleonAPIResult<never>
    
    const message = buildMessage(result.data as Record<string, unknown>, this.store)

    this.store.messages.set(message.id, message)
    
    return { ok: true, data: message }
  }

  async edit(channelId: string, messageId: string, payload: MessageCreateOptions): Promise<ChameleonAPIResult<Message>> {
    
    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : { ...payload }

    if (typeof payload === 'object') {
      if (payload.embeds) {
        data.embeds = payload.embeds.map(e => (e && typeof (e as { toJSON?(): Record<string, unknown> }).toJSON === 'function' ? (e as { toJSON(): Record<string, unknown> }).toJSON() : e))
      }
      if (payload.components) {
        data.components = payload.components.map(c => serializeComponent(c))
      }
    }

    const result = await this.rest.patch<unknown>(`/channels/${channelId}/messages/${messageId}`, data)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const oldMsg = this.store.messages.get(messageId)
    const message = buildMessage(result.data as Record<string, unknown>, this.store, oldMsg)
    this.store.messages.set(message.id, message)
    
    return { ok: true, data: message }
  }

  async delete(channelId: string, messageId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.delete(`/channels/${channelId}/messages/${messageId}`)
    
    if (result.ok) {
      this.store.messages.delete(messageId)
    }
    
    return result as ChameleonAPIResult<void>
  }

  async list(channelId: string, options?: { limit?: number, before?: string, after?: string, around?: string }): Promise<ChameleonAPIResult<Message[]>> {
    
    let url = `/channels/${channelId}/messages`
    
    if (options) {

      const params = new URLSearchParams()
      
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.before) params.append('before', options.before)
      if (options.after) params.append('after', options.after)
      if (options.around) params.append('around', options.around)
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown[]>(url)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const messages = (result.data as Record<string, unknown>[]).map(msgData => {
      const msg = buildMessage(msgData, this.store)
      this.store.messages.set(msg.id, msg)
      return msg
    })

    return { ok: true, data: messages }
  }
}