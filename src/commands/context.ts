import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { Embed } from '../types/message/index.js'
import type { MessageComponent } from '../types/components/index.js'
import { serializeComponent } from '../builders/index.js'
import { INTERACTION_CALLBACK_TYPES, COMPONENT_TYPES, MESSAGE_FLAGS, TEXT_INPUT_STYLES } from '../utils/constants.js'
import type { ChameleonAPIResult } from '../rest/types.js'

export type InteractionReplyOptions = string | {
  content?: string
  embeds?: (Embed | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  components?: (MessageComponent | { build?(): MessageComponent } | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  ephemeral?: boolean
}

export class BaseInteractionContext {
  public user: User
  public guild?: Guild | { id: string } | undefined
  public channel?: Channel | { id: string } | undefined
  public interactionId: string
  public interactionToken: string

  protected _client: Client
  protected _deferred = false
  protected _replied = false

  constructor(
    client: Client,
    raw: Record<string, unknown>,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    this._client = client
    this.interactionId = raw.id as string
    this.interactionToken = raw.token as string
    this.user = user
    this.guild = guild
    this.channel = channel
  }

  get replied() { return this._replied }
  get deferred() { return this._deferred }

  protected _assertOk(result: ChameleonAPIResult<unknown>, action: string): void {
    
    if (result.ok) return

    const details = result.message ? `: ${result.message}` : ''
    const raw = result.raw !== undefined ? ` | raw=${JSON.stringify(result.raw)}` : ''
    throw new Error(`Discord rejected interaction ${action}${details}${raw}`)
  }

  protected _resolvePayload(payload: InteractionReplyOptions): Record<string, unknown> {

    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : { ...payload }
    
    if (typeof payload === 'object') {
      
      if (payload.ephemeral) data.flags = MESSAGE_FLAGS.EPHEMERAL
      if (payload.embeds) {
        data.embeds = payload.embeds.map((e: unknown) => {
          if (e && typeof (e as Record<string, unknown>).toJSON === 'function') {
            return (e as { toJSON(): Record<string, unknown> }).toJSON()
          }
          return e
        })
      }

      if (payload.components) {
        data.components = payload.components.map(c => serializeComponent(c))
      }
    }
    return data
  }

  protected _serializeModalField(field: Record<string, unknown>): Record<string, unknown> {

    const component: Record<string, unknown> = {
      type: field.type === TEXT_INPUT_STYLES.SHORT || field.type === TEXT_INPUT_STYLES.PARAGRAPH
        ? COMPONENT_TYPES.TEXT_INPUT
        : field.type,
      custom_id: field.id,
      required: field.required,
    }

    if (field.type === TEXT_INPUT_STYLES.SHORT || field.type === TEXT_INPUT_STYLES.PARAGRAPH) {
      component.style = field.type
      component.min_length = field.minLength
      component.max_length = field.maxLength
      component.placeholder = field.placeholder
      component.value = field.value
    } else if (field.type === COMPONENT_TYPES.CHECKBOX) {
      component.value = field.value
    } else if (field.type === COMPONENT_TYPES.RADIO_GROUP) {
      component.options = field.options
    } else if (field.type === COMPONENT_TYPES.CHECKBOX_GROUP) {
      component.min_values = field.minValues
      component.max_values = field.maxValues
      component.options = field.options
    }

    const cleanComponent = Object.fromEntries(Object.entries(component).filter(([, value]) => value !== undefined))

    return {
      type: COMPONENT_TYPES.LABEL,
      label: field.label,
      component: cleanComponent
    }
  }

  async reply(payload: InteractionReplyOptions): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const data = this._resolvePayload(payload)

    const result = await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data
    })
    this._assertOk(result, 'reply')
    this._replied = true
  }

  async defer(options?: { ephemeral?: boolean }): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const result = await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: options?.ephemeral ? MESSAGE_FLAGS.EPHEMERAL : 0 }
    })
    this._assertOk(result, 'defer')
    this._deferred = true
  }

  async followUp(payload: InteractionReplyOptions): Promise<void> {

    if (!this._deferred && !this._replied) throw new Error('Interaction not acknowledged.')
    
    const data = this._resolvePayload(payload)

    const result = await this._client.rest.post(`/webhooks/${this._client.user?.id}/${this.interactionToken}`, data)
    this._assertOk(result, 'followUp')
  }

  async showModal(modal: Record<string, unknown> | { type?: string, customId?: string, title?: string, fields?: readonly unknown[] }): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const payload = modal.type === 'modal' ? {
      custom_id: modal.customId,
      title: modal.title,
      components: Array.isArray(modal.fields) ? modal.fields.map((f: Record<string, unknown>) => this._serializeModalField(f)) : []
    } : modal

    const result = await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.MODAL,
      data: payload
    })
    this._assertOk(result, 'showModal')
    this._replied = true
  }
}

export class CommandContext<Options = Record<string, unknown>> extends BaseInteractionContext {
  
  public options: Options

  constructor(
    client: Client,
    rawInteraction: Record<string, unknown>,
    parsedOptions: Options,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    super(client, rawInteraction, user, guild, channel)
    this.options = parsedOptions
  }
}