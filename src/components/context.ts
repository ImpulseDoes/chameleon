import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { InteractionReplyOptions } from '../commands/context.js'
import { INTERACTION_CALLBACK_TYPES, COMPONENT_TYPES } from '../utils/constants.js'

export class ComponentContext<Values = any, Fields = any> {

  public user: User
  public guild?: Guild | { id: string } | undefined
  public channel?: Channel | { id: string } | undefined
  public interactionId: string
  public interactionToken: string
  public customId: string
  public values: Values
  public fields: Fields

  private _client: Client
  private _deferred = false
  private _replied = false

  constructor (
    client: Client,
    rawInteraction: Record<string, any>,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    this._client = client
    this.interactionId = rawInteraction.id
    this.interactionToken = rawInteraction.token
    this.customId = rawInteraction.data?.custom_id as string
    this.user = user
    this.guild = guild
    this.channel = channel
    
    this.values = (rawInteraction.data?.values as Values) ?? ([] as Values)
    
    const fields: Record<string, any> = {}
    
    if (rawInteraction.data?.components) {
      for (const row of rawInteraction.data.components as any[]) {
        for (const comp of row.components as any[]) {
          fields[comp.custom_id] = comp.value
        }
      }
    }
    this.fields = fields as Fields
  }

  get replied() { return this._replied }
  get deferred() { return this._deferred }

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
      data: {
        flags: options?.ephemeral ? 64 : 0
      }
    })
    this._deferred = true
  }
  
  async update(payload: InteractionReplyOptions): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }

    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.UPDATE_MESSAGE,
      data
    })
    this._replied = true
  }
  
  async deferUpdate(): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.DEFERRED_UPDATE_MESSAGE,
    })
    this._deferred = true
  }

  async followUp(payload: InteractionReplyOptions): Promise<void> {
    
    if (!this._deferred && !this._replied) throw new Error('Interaction not acknowledged. Use reply or defer first.')
    
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }

    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64

    await this._client.rest.post(`/webhooks/${this._client.user?.id}/${this.interactionToken}`, data)
  }
  
  async showModal(modal: any): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.MODAL,
      data: modal.type === 'modal' ? buildModalPayload(modal) : modal
    })
    this._replied = true
  }
}

export function buildModalPayload(def: any) {
  return {
    custom_id: def.customId,
    title: def.title,
    components: def.fields.map((f: any) => ({
      type: COMPONENT_TYPES.ACTION_ROW,
      components: [{
        type: COMPONENT_TYPES.TEXT_INPUT,
        custom_id: f.id,
        style: f.type, // 1 short, 2 paragraph
        label: f.label,
        required: f.required,
        min_length: f.minLength,
        max_length: f.maxLength,
        placeholder: f.placeholder,
        value: f.value
      }]
    }))
  }
}