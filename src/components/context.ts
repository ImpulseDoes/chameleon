import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
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
  public message?: Record<string, unknown>
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

    this.customId = data?.custom_id ?? ''
    
    if (raw.message) {
      this.message = raw.message as Record<string, unknown>
    }

    this.values = (data?.values as Values) ?? ([] as Values)

    const fields: Record<string, unknown> = {}

    if (data?.components) {
      for (const row of data.components) {
        for (const comp of row.components) {
          fields[comp.custom_id] = comp.value
        }
      }
    }
    this.fields = fields as Fields
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
    
    const data = this._resolvePayload(payload)

    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: INTERACTION_CALLBACK_TYPES.UPDATE_MESSAGE,
      data
    })
    this._replied = true
  }
}