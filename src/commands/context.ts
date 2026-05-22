import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'

export type InteractionReplyOptions = string | {
  content?: string
  embeds?: any[]
  components?: any[]
  ephemeral?: boolean
}

export class CommandContext<Options = Record<string, any>> {

  public options: Options
  public user: User
  public guild?: Guild | { id: string } | undefined
  public channel?: Channel | { id: string } | undefined
  public interactionId: string
  public interactionToken: string

  private _client: Client
  private _deferred = false
  private _replied = false

  constructor(
    client: Client,
    rawInteraction: Record<string, any>,
    parsedOptions: Options,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    this._client = client
    this.interactionId = rawInteraction.id
    this.interactionToken = rawInteraction.token
    this.options = parsedOptions
    this.user = user
    this.guild = guild
    this.channel = channel
  }

  get replied() { return this._replied }
  get deferred() { return this._deferred }

  async reply(payload: InteractionReplyOptions): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }
    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64

    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data
    })
    this._replied = true
  }

  async defer(options?: { ephemeral?: boolean }): Promise<void> {

    if (this._replied || this._deferred) throw new Error('Interaction already acknowledged.')
    
    await this._client.rest.post(`/interactions/${this.interactionId}/${this.interactionToken}/callback`, {
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        flags: options?.ephemeral ? 64 : 0
      }
    })
    this._deferred = true
  }

  async followUp(payload: InteractionReplyOptions): Promise<void> {
    
    if (!this._deferred && !this._replied) throw new Error('Interaction not acknowledged. Use reply or defer first.')
    
    const data: any = typeof payload === 'string' ? { content: payload } : { ...payload }
    if (typeof payload === 'object' && payload.ephemeral) data.flags = 64

    await this._client.rest.post(`/webhooks/${this._client.user?.id}/${this.interactionToken}`, data)
  }
}