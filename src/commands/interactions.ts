import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { InteractionReplyOptions } from './context.js'
import { INTERACTION_CALLBACK_TYPES } from '../utils/constants.js'

export class ComponentContext {
  
  public customId: string
  public user: User
  public guild?: Guild | { id: string } | undefined
  public channel?: Channel | { id: string } | undefined
  public message?: Record<string, unknown>

  public interactionId: string
  public interactionToken: string

  private _client: Client
  private _deferred = false
  private _replied = false

  constructor(
    client: Client,
    raw: Record<string, any>,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    this._client = client
    this.interactionId = raw.id
    this.interactionToken = raw.token
    this.customId = raw.data?.custom_id ?? ''
    this.message = raw.message
    this.user = user
    this.guild = guild
    this.channel = channel
  }

  get replied() { return this._replied }
  get deferred() { return this._deferred }

  /** Values from a select menu interaction */
  get values(): string[] {
    return (this as any)._values ?? []
  }

  async reply(payload: InteractionReplyOptions): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }
    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64
    
    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data
    })
    this._replied = true
  }

  async deferUpdate(): Promise<void> {
    
    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.DEFERRED_UPDATE_MESSAGE
    })
    this._deferred = true
  }

  async update(payload: InteractionReplyOptions): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }
    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64

    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.UPDATE_MESSAGE,
      data
    })
    this._replied = true
  }

  async followUp(payload: InteractionReplyOptions): Promise<void> {

    if (!this._deferred && !this._replied) throw new Error('Interaction not acknowledged.')
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }

    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64
    
    await this._client.rest.post(`/webhooks/${this._client.user?.id}/${this.interactionToken}`, data)
  }
}

export class ModalContext {

  public customId: string
  public user: User
  public guild?: Guild | { id: string } | undefined
  public channel?: Channel | { id: string } | undefined
  public interactionId: string
  public interactionToken: string

  private _fields: Map<string, string> = new Map()
  private _client: Client
  private _replied = false
  private _deferred = false

  constructor(
    client: Client,
    raw: Record<string, any>,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    this._client = client
    this.interactionId = raw.id
    this.interactionToken = raw.token
    this.customId = raw.data?.custom_id ?? ''
    this.user = user
    this.guild = guild
    this.channel = channel

    // parse modal fields from action rows
    const rows = raw.data?.components ?? []
    for (const row of rows) {
      for (const comp of row.components ?? []) {
        if (comp.custom_id && comp.value !== undefined) {
          this._fields.set(comp.custom_id, comp.value)
        }
      }
    }
  }

  get replied() { return this._replied }
  get deferred() { return this._deferred }

  /** Get a text input value by its customId */
  getField(customId: string): string | undefined {
    return this._fields.get(customId)
  }

  /** Get all field values as a plain object */
  get fields(): Record<string, string> {
    return Object.fromEntries(this._fields)
  }

  async reply(payload: InteractionReplyOptions): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }
    
    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64

    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data
    })
    this._replied = true
  }

  async defer(options?: { ephemeral?: boolean }): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: options?.ephemeral ? 64 : 0 }
    })
    this._deferred = true
  }

  async followUp(payload: InteractionReplyOptions): Promise<void> {

    if (!this._deferred && !this._replied) throw new Error('Interaction not acknowledged.')
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }
    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64

    await this._client.rest.post(`/webhooks/${this._client.user?.id}/${this.interactionToken}`, data)
  }
}