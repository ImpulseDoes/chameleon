import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { Embed } from '../types/message/index.js'
import type { MessageComponent } from '../types/components/index.js'
import type { ModalDef, ModalFieldDef, ModalFieldType } from '../components/define.js'
import type { AttachmentBuilder } from '../builders/attachment.js'
import { serializeComponent } from '../builders/index.js'
import { INTERACTION_CALLBACK_TYPES, MESSAGE_FLAGS } from '../utils/constants.js'
import { Label } from '../components/v2.js'
import type { ChameleonAPIResult } from '../rest/types.js'

export type InteractionReplyOptions = string | {
  content?: string
  embeds?: (Embed | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  components?: (MessageComponent | { build?(): MessageComponent } | { toJSON(): Record<string, unknown> } | Record<string, unknown>)[]
  files?: AttachmentBuilder[]
  ephemeral?: boolean
  flags?: number
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

  get client() { return this._client }
  get replied() { return this._replied }
  get deferred() { return this._deferred }

  protected _assertOk(result: ChameleonAPIResult<unknown>, action: string): void {
    
    if (result.ok) return

    const details = result.message ? `: ${result.message}` : ''
    const raw = result.raw !== undefined ? ` | raw=${JSON.stringify(result.raw)}` : ''
    throw new Error(`Discord rejected interaction ${action}${details}${raw}`)
  }

  protected _resolvePayload(payload: InteractionReplyOptions): { data: Record<string, unknown>, files?: AttachmentBuilder[] } {

    const data: Record<string, unknown> = typeof payload === 'string' ? { content: payload } : { ...payload }
    let files: AttachmentBuilder[] | undefined
    
    if (typeof payload === 'object') {
      
      if (payload.flags !== undefined || payload.ephemeral) {
        data.flags = (payload.flags ?? 0) | (payload.ephemeral ? MESSAGE_FLAGS.EPHEMERAL : 0)
      }
      
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

      if (payload.files && payload.files.length > 0) {
        files = payload.files
        delete data.files
      }
    }
    
    return files ? { data, files } : { data }
  }

  protected _serializeModalField(field: ModalFieldDef<boolean, ModalFieldType>): Record<string, unknown> {
    return Label.of(field)
  }

  async reply(payload: InteractionReplyOptions): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    this._replied = true
    
    try {

      const { data, files } = this._resolvePayload(payload)
      const body = {
        type: INTERACTION_CALLBACK_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
        data
      }

      const result = files && files.length > 0
        ? await this._client.rest.requestWithFiles('POST', `/interactions/${this.interactionId}/${this.interactionToken}/callback`, body, files, undefined, 'data')
        : await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, body)
        
      this._assertOk(result, 'reply')
    } catch (error) {
      this._replied = false
      throw error
    }
  }

  async defer(options?: { ephemeral?: boolean }): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    this._deferred = true

    try {

      const result = await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
        type: INTERACTION_CALLBACK_TYPES.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: options?.ephemeral ? MESSAGE_FLAGS.EPHEMERAL : 0 }
      })

      this._assertOk(result, 'defer')
    } catch (error) {
      this._deferred = false
      throw error
    }
  }

  async followUp(payload: InteractionReplyOptions): Promise<void> {

    if (!this._deferred && !this._replied) throw new Error('Interaction not acknowledged.')
    
    const { data, files } = this._resolvePayload(payload)
    const result = files && files.length > 0
      ? await this._client.rest.requestWithFiles('POST', `/webhooks/${this._client.user?.id}/${this.interactionToken}`, data, files)
      : await this._client.rest.post(`/webhooks/${this._client.user?.id}/${this.interactionToken}`, data)
    this._assertOk(result, 'followUp')
  }

  async showModal(modal: Record<string, unknown> | (ModalDef<ReadonlyArray<ModalFieldDef<boolean, ModalFieldType>>> & { type: 'modal' })): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    this._replied = true
    
    try {
     
      const payload = modal.type === 'modal' ? {
        custom_id: modal.customId,
        title: modal.title,
        components: Array.isArray(modal.fields) ? modal.fields.map(f => this._serializeModalField(f)) : []
      } : modal

      const result = await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
        type: INTERACTION_CALLBACK_TYPES.MODAL,
        data: payload
      })

      this._assertOk(result, 'showModal')
    } catch (error) {
      this._replied = false
      throw error
    }
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