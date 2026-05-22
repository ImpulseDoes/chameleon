import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildMessage } from '../builders/index.js'
import type { Message } from '../types/message/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'

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

  async send(channelId: string, payload: string | Record<string, any>): Promise<ChameleonAPIResult<Message>> {

    const data = typeof payload === 'string' ? { content: payload } : payload
    const result = await this.rest.post<unknown>(`/channels/${channelId}/messages`, data)

    if (!result.ok) return result
    
    const message = buildMessage(result.data as Record<string, unknown>, this.store)

    this.store.messages.set(message.id, message)
    
    return { ok: true, data: message }
  }

  async edit(channelId: string, messageId: string, payload: string | Record<string, any>): Promise<ChameleonAPIResult<Message>> {
    
    const data = typeof payload === 'string' ? { content: payload } : payload
    const result = await this.rest.patch<unknown>(`/channels/${channelId}/messages/${messageId}`, data)
    
    if (!result.ok) return result

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
}