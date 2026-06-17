import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { Message } from '../types/message/index.js'
import { BaseInteractionContext, type InteractionReplyOptions } from '../commands/context.js'
import { INTERACTION_CALLBACK_TYPES } from '../utils/constants.js'

interface InteractionData {
  custom_id?: string
  values?: unknown[]
  components?: { components: { custom_id: string, value: unknown }[] }[]
  component_type?: number
  resolved?: Record<string, unknown>
}

export class ComponentContext<Values = unknown, Fields = unknown> extends BaseInteractionContext {
  
  public customId: string
  public componentType: number | undefined
  public data: Record<string, unknown> | undefined
  public message?: Partial<Message>
  public values: Values
  public fields: Fields

  constructor(
    client: Client,
    raw: Record<string, unknown>,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    super(client, raw, user, guild, channel)

    const data = raw.data as InteractionData | undefined

    this.data = raw.data ? raw.data as Record<string, unknown> : undefined
    this.customId = data?.custom_id ?? ''
    this.componentType = data?.component_type

    if (raw.message) {
      this.message = raw.message as Partial<Message>
    }

    this.values = (data?.values as Values) ?? ([] as Values)

    const fields: Record<string, unknown> = {}

    if (data?.components) {

      const extractFields = (components: Record<string, unknown>[]) => {
        
        for (const comp of components) {
        
          if (comp.custom_id !== undefined) {
            
            const customId = comp.custom_id as string
        
            if (comp.values !== undefined) {
              fields[customId] = comp.values
            } else if (comp.value !== undefined) {
              fields[customId] = comp.value
            }
          }

          if (comp.components) {
            extractFields(comp.components as Record<string, unknown>[])
          }

          if (comp.component) {
            extractFields([comp.component as Record<string, unknown>])
          }
        }
      }
      extractFields(data.components as unknown as Record<string, unknown>[])
    }
    this.fields = fields as Fields
  }

  async deferUpdate(): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const result = await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.DEFERRED_UPDATE_MESSAGE
    })
    this._assertOk(result, 'deferUpdate')
    this._deferred = true
  }

  async update(payload: InteractionReplyOptions): Promise<void> {
    
    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const { data, files } = this._resolvePayload(payload)
    const body = {
      type: INTERACTION_CALLBACK_TYPES.UPDATE_MESSAGE,
      data
    }
    const result = files && files.length > 0
      ? await this._client.rest.requestWithFiles('POST', `/interactions/${this.interactionId}/${this.interactionToken}/callback`, body, files, undefined, 'data')
      : await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, body)
    this._assertOk(result, 'update')
    this._replied = true
  }
}