import type { ChameleonREST } from '../rest/index.js'
import { buildWebhook, serializeComponent, buildMessage, validateMessageComponents } from '../builders/index.js'
import type { AttachmentBuilder } from '../builders/attachment.js'
import type { TongueStore } from '../client/store.js'
import type { Webhook } from '../types/webhook/index.js'
import type { Message, WebhookMessageCreateOptions } from '../types/message/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class WebhookManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  private _buildWebhook(raw: unknown): Webhook {
    return buildWebhook(raw as Record<string, unknown>)
  }

  private _buildWebhooks(raw: unknown[]): Webhook[] {
    return raw.map(webhook => this._buildWebhook(webhook))
  }

  async fetch(webhookId: string, token?: string): Promise<ChameleonAPIResult<Webhook>> {

    const url = token ? `/webhooks/${webhookId}/${token}` : `/webhooks/${webhookId}`
    const result = await this.rest.get<unknown>(url)
    
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._buildWebhook(result.data) }
  }

  async fetchByChannel(channelId: string): Promise<ChameleonAPIResult<Webhook[]>> {

    const result = await this.rest.get<unknown[]>(`/channels/${channelId}/webhooks`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const webhooks = this._buildWebhooks(result.data)

    return { ok: true, data: webhooks }
  }

  async fetchByGuild(guildId: string): Promise<ChameleonAPIResult<Webhook[]>> {
    
    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/webhooks`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const webhooks = this._buildWebhooks(result.data)
    
    return { ok: true, data: webhooks }
  }

  async create(channelId: string, payload: { name: string, avatar?: string | null }, reason?: string): Promise<ChameleonAPIResult<Webhook>> {
    
    const result = await this.rest.post<unknown>(`/channels/${channelId}/webhooks`, toSnakeCase(payload), createAuditLogHeaders(reason))
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: this._buildWebhook(result.data) }
  }

  async edit(webhookId: string, payload: { name?: string, avatar?: string | null, channelId?: string }, token?: string, reason?: string): Promise<ChameleonAPIResult<Webhook>> {
    
    const url = token ? `/webhooks/${webhookId}/${token}` : `/webhooks/${webhookId}`
    const result = await this.rest.patch<unknown>(url, toSnakeCase(payload), createAuditLogHeaders(reason))

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: this._buildWebhook(result.data) }
  }

  async delete(webhookId: string, token?: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const url = token ? `/webhooks/${webhookId}/${token}` : `/webhooks/${webhookId}`
    const result = await this.rest.delete(url, createAuditLogHeaders(reason))
    
    return result as ChameleonAPIResult<void>
  }

  async execute(webhookId: string, token: string, payload: WebhookMessageCreateOptions, options?: { wait?: boolean, threadId?: string }): Promise<ChameleonAPIResult<Message | void>> {
    
    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : {}
    
    let files: AttachmentBuilder[] | undefined

    if (typeof payload === 'object') {

      if (payload.content !== undefined) data.content = payload.content
      if (payload.username !== undefined) data.username = payload.username
      if (payload.avatarUrl !== undefined) data.avatar_url = payload.avatarUrl
      if (payload.tts !== undefined) data.tts = payload.tts
      if (payload.flags !== undefined) data.flags = payload.flags
      if (payload.threadName !== undefined) data.thread_name = payload.threadName
      if (payload.allowedMentions) data.allowed_mentions = toSnakeCase(payload.allowedMentions)
      
      if (payload.embeds) {
        data.embeds = payload.embeds.map(e => (e && typeof (e as { toJSON?(): Record<string, unknown> }).toJSON === 'function' ? (e as { toJSON(): Record<string, unknown> }).toJSON() : e))
      }
      
      if (payload.components) {
        data.components = payload.components.map(c => serializeComponent(c))
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

      if (payload.files && payload.files.length > 0) {
        files = payload.files
      }

      validateMessageComponents(data)
    }

    let url = `/webhooks/${webhookId}/${token}`
    const params = new URLSearchParams()
    
    if (options?.wait) params.append('wait', 'true')
    if (options?.threadId) params.append('thread_id', options.threadId)
    
    const qs = params.toString()
    if (qs) url += `?${qs}`

    let result: ChameleonAPIResult<unknown>

    if (files && files.length > 0) {
      result = await this.rest.requestWithFiles<unknown>('POST', url, data, files)
    } else {
      result = await this.rest.post<unknown>(url, data)
    }

    if (!result.ok) return result as ChameleonAPIResult<never>

    if (options?.wait && result.data) {
      const message = buildMessage(result.data as Record<string, unknown>, this.store)
      this.store.messages.set(message.id, message)
      return { ok: true, data: message }
    }

    return { ok: true, data: undefined }
  }
}