import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildMessage, serializeComponent, buildUser } from '../builders/index.js'
import type { AttachmentBuilder } from '../builders/attachment.js'
import type { Message, Embed, MessageCreateOptions } from '../types/message/index.js'
import type { MessageComponent } from '../types/components/index.js'
import type { User } from '../types/user/index.js'
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

  async send(channelId: string, payload: MessageCreateOptions): Promise<ChameleonAPIResult<Message>> {

    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : { ...payload }
    let files: AttachmentBuilder[] | undefined

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
      
      if (payload.poll) {

        data.poll = {
          question: payload.poll.question,
          answers: payload.poll.answers.map(a => ({
            ...(a.answerId !== undefined ? { answer_id: a.answerId } : {}),
            poll_media: a.pollMedia
          })),
          ...(payload.poll.duration !== undefined ? { duration: payload.poll.duration } : {}),
          ...(payload.poll.allowMultiselect !== undefined ? { allow_multiselect: payload.poll.allowMultiselect } : {}),
          ...(payload.poll.layoutType !== undefined ? { layout_type: payload.poll.layoutType } : {}),
        }
      }

      if (payload.tts !== undefined) data.tts = payload.tts
      if (payload.flags !== undefined) data.flags = payload.flags
      if (payload.nonce !== undefined) data.nonce = payload.nonce
      if (payload.enforceNonce !== undefined) data.enforce_nonce = payload.enforceNonce
      if (payload.stickerIds && payload.stickerIds.length > 0) {
        data.sticker_ids = payload.stickerIds
        delete data.stickerIds
      }

      if (payload.files && payload.files.length > 0) {
        files = payload.files
        delete data.files
      }
    }

    let result: ChameleonAPIResult<unknown>

    if (files && files.length > 0) {
      result = await this.rest.requestWithFiles<unknown>('POST', `/channels/${channelId}/messages`, data, files)
    } else {
      result = await this.rest.post<unknown>(`/channels/${channelId}/messages`, data)
    }

    if (!result.ok) return result as ChameleonAPIResult<never>
    
    const message = buildMessage(result.data as Record<string, unknown>, this.store)

    this.store.messages.set(message.id, message)
    
    return { ok: true, data: message }
  }

  async edit(channelId: string, messageId: string, payload: MessageCreateOptions): Promise<ChameleonAPIResult<Message>> {
    
    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : { ...payload }
    let files: AttachmentBuilder[] | undefined

    if (typeof payload === 'object') {
      if (payload.embeds) {
        data.embeds = payload.embeds.map(e => (e && typeof (e as { toJSON?(): Record<string, unknown> }).toJSON === 'function' ? (e as { toJSON(): Record<string, unknown> }).toJSON() : e))
      }
      if (payload.components) {
        data.components = payload.components.map(c => serializeComponent(c))
      }
      if (payload.files && payload.files.length > 0) {
        files = payload.files
        delete data.files
      }
    }

    let result: ChameleonAPIResult<unknown>

    if (files && files.length > 0) {
      result = await this.rest.requestWithFiles<unknown>('PATCH', `/channels/${channelId}/messages/${messageId}`, data, files)
    } else {
      result = await this.rest.patch<unknown>(`/channels/${channelId}/messages/${messageId}`, data)
    }
    
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

  async react(channelId: string, messageId: string, emoji: string): Promise<ChameleonAPIResult<void>> {

    const encodedEmoji = encodeURIComponent(emoji)
    const result = await this.rest.put(`/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`)
    
    return result as ChameleonAPIResult<void>
  }

  async removeReaction(channelId: string, messageId: string, emoji: string, userId: string = '@me'): Promise<ChameleonAPIResult<void>> {

    const encodedEmoji = encodeURIComponent(emoji)
    const result = await this.rest.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/${userId}`)
    
    return result as ChameleonAPIResult<void>
  }

  async removeAllReactions(channelId: string, messageId: string, emoji?: string): Promise<ChameleonAPIResult<void>> {

    let url = `/channels/${channelId}/messages/${messageId}/reactions`
    
    if (emoji) url += `/${encodeURIComponent(emoji)}`

    const result = await this.rest.delete(url)
    
    return result as ChameleonAPIResult<void>
  }

  async getReactions(channelId: string, messageId: string, emoji: string, options?: { after?: string, limit?: number, type?: number }): Promise<ChameleonAPIResult<User[]>> {
    
    let url = `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
    
    if (options) {
      
      const params = new URLSearchParams()
      
      if (options.after) params.append('after', options.after)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.type !== undefined) params.append('type', options.type.toString())
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown[]>(url)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const users = (result.data as Record<string, unknown>[]).map(userData => {

      const user = buildUser(userData)
      
      this.store.users.set(user.id, user)
      
      return user
    })

    return { ok: true, data: users }
  }

  async pin(channelId: string, messageId: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.put(`/channels/${channelId}/pins/${messageId}`)
    
    return result as ChameleonAPIResult<void>
  }

  async unpin(channelId: string, messageId: string): Promise<ChameleonAPIResult<void>> {
    
    const result = await this.rest.delete(`/channels/${channelId}/pins/${messageId}`)
    
    return result as ChameleonAPIResult<void>
  }

  async getPins(channelId: string): Promise<ChameleonAPIResult<Message[]>> {

    const result = await this.rest.get<unknown[]>(`/channels/${channelId}/pins`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const messages = (result.data as Record<string, unknown>[]).map(msgData => {

      const msg = buildMessage(msgData, this.store)
      
      this.store.messages.set(msg.id, msg)
      
      return msg
    })

    return { ok: true, data: messages }
  }

  async bulkDelete(channelId: string, messageIds: string[]): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.post(`/channels/${channelId}/messages/bulk-delete`, { messages: messageIds })
    
    if (result.ok) {

      for (const id of messageIds) {
        this.store.messages.delete(id)
      }
    }
    
    return result as ChameleonAPIResult<void>
  }

  async forward(channelId: string, messageId: string): Promise<ChameleonAPIResult<Message>> {

    const result = await this.rest.post<unknown>(`/channels/${channelId}/messages/${messageId}/crosspost`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const oldMsg = this.store.messages.get(messageId)
    const message = buildMessage(result.data as Record<string, unknown>, this.store, oldMsg)
    
    this.store.messages.set(message.id, message)
    
    return { ok: true, data: message }
  }

  async endPoll(channelId: string, messageId: string): Promise<ChameleonAPIResult<Message>> {

    const result = await this.rest.post<unknown>(`/channels/${channelId}/polls/${messageId}/expire`)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const message = buildMessage(result.data as Record<string, unknown>, this.store)
    this.store.messages.set(message.id, message)

    return { ok: true, data: message }
  }

  async getPollAnswerVoters(channelId: string, messageId: string, answerId: number, options?: { after?: string, limit?: number }): Promise<ChameleonAPIResult<User[]>> {

    let url = `/channels/${channelId}/polls/${messageId}/answers/${answerId}`

    if (options) {

      const params = new URLSearchParams()
      
      if (options.after) params.append('after', options.after)
      if (options.limit) params.append('limit', options.limit.toString())
      
      const qs = params.toString()
      
      if (qs) url += `?${qs}`
    }

    const result = await this.rest.get<unknown>(url)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const data = result.data as { users: Record<string, unknown>[] }
    const users = data.users.map(u => {
      const user = buildUser(u)
      this.store.users.set(user.id, user)
      return user
    })

    return { ok: true, data: users }
  }
}