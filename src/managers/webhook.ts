import type { ChameleonREST } from '../rest/index.js'
import { buildWebhook, serializeComponent, buildMessage } from '../builders/index.js'
import type { TongueStore } from '../client/store.js'
import type { Webhook } from '../types/webhook/index.js'
import type { Message, Embed } from '../types/message/index.js'
import type { MessageComponent } from '../types/components/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'

export type WebhookMessageCreateOptions = string | {
  content?: string
  username?: string
  avatarUrl?: string
  embeds?: (Embed | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  components?: (MessageComponent | { build?(): MessageComponent } | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  threadName?: string
  appliedTags?: string[]
}

export class WebhookManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  async fetch(webhookId: string, token?: string): Promise<ChameleonAPIResult<Webhook>> {

    const url = token ? `/webhooks/${webhookId}/${token}` : `/webhooks/${webhookId}`
    const result = await this.rest.get<unknown>(url)
    
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: buildWebhook(result.data as Record<string, unknown>) }
  }

  async fetchByChannel(channelId: string): Promise<ChameleonAPIResult<Webhook[]>> {

    const result = await this.rest.get<unknown[]>(`/channels/${channelId}/webhooks`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const webhooks = (result.data as Record<string, unknown>[]).map(w => buildWebhook(w))

    return { ok: true, data: webhooks }
  }

  async fetchByGuild(guildId: string): Promise<ChameleonAPIResult<Webhook[]>> {
    
    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/webhooks`)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    const webhooks = (result.data as Record<string, unknown>[]).map(w => buildWebhook(w))
    
    return { ok: true, data: webhooks }
  }

  async create(channelId: string, payload: { name: string, avatar?: string | null }, reason?: string): Promise<ChameleonAPIResult<Webhook>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.post<unknown>(`/channels/${channelId}/webhooks`, toSnakeCase(payload), headers)
    
    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: buildWebhook(result.data as Record<string, unknown>) }
  }

  async edit(webhookId: string, payload: { name?: string, avatar?: string | null, channelId?: string }, token?: string, reason?: string): Promise<ChameleonAPIResult<Webhook>> {
    
    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const url = token ? `/webhooks/${webhookId}/${token}` : `/webhooks/${webhookId}`
    const result = await this.rest.patch<unknown>(url, toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: buildWebhook(result.data as Record<string, unknown>) }
  }

  async delete(webhookId: string, token?: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const url = token ? `/webhooks/${webhookId}/${token}` : `/webhooks/${webhookId}`
    const result = await this.rest.delete(url, headers)
    
    return result as ChameleonAPIResult<void>
  }

  async execute(webhookId: string, token: string, payload: WebhookMessageCreateOptions, options?: { wait?: boolean, threadId?: string }): Promise<ChameleonAPIResult<Message | void>> {
    
    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : { ...(toSnakeCase(payload) as Record<string, unknown>) }

    if (typeof payload === 'object') {
      
      if (payload.embeds) {
        data.embeds = payload.embeds.map(e => (e && typeof (e as { toJSON?(): Record<string, unknown> }).toJSON === 'function' ? (e as { toJSON(): Record<string, unknown> }).toJSON() : e))
      }
      
      if (payload.components) {
        data.components = payload.components.map(c => serializeComponent(c))
      }
    }

    let url = `/webhooks/${webhookId}/${token}`
    const params = new URLSearchParams()
    
    if (options?.wait) params.append('wait', 'true')
    if (options?.threadId) params.append('thread_id', options.threadId)
    
    const qs = params.toString()
    if (qs) url += `?${qs}`

    const result = await this.rest.post<unknown>(url, data)
    if (!result.ok) return result as ChameleonAPIResult<never>

    if (options?.wait && result.data) {
      const message = buildMessage(result.data as Record<string, unknown>, this.store)
      this.store.messages.set(message.id, message)
      return { ok: true, data: message }
    }

    return { ok: true, data: undefined }
  }
}