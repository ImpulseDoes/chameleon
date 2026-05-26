import type { Client } from '../client/client.js'
import type { Message } from '../types/message/index.js'
import { ComponentContext } from '../components/context.js'
import { resolveGuild, resolveChannel, buildUser } from '../builders/index.js'
import { INTERACTION_TYPES } from '../utils/constants.js'

export interface AwaitMessagesOptions {
  filter?: (message: Message) => boolean
  max?: number
  time?: number
}

export interface AwaitComponentOptions {
  filter?: (ctx: ComponentContext) => boolean
  time?: number
}

export class CollectorManager {

  constructor(private client: Client) {}

  /**
   * Waits for a specified number of messages in a given channel that pass the filter, if the time limit
   * is reached, resolves with the messages collected so far
   */
  async awaitMessages(channelId: string, options: AwaitMessagesOptions = {}): Promise<Message[]> {

    const { filter, max = 1, time = 15000 } = options

    return new Promise((resolve) => {

      const messages: Message[] = []

      let timeoutId: NodeJS.Timeout | null = null

      const handler = (data: { type: 'MESSAGE_CREATE', message: Message }) => {

        const msg = data.message

        if (msg.channelId !== channelId) return
        if (filter && !filter(msg)) return

        messages.push(msg)

        if (messages.length >= max) {
          cleanup()
          resolve(messages)
        }
      }

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)

        this.client.off('MESSAGE_CREATE', handler)
      }

      this.client.on('MESSAGE_CREATE', handler)

      if (time > 0) {
        timeoutId = setTimeout(() => {
          cleanup()
          resolve(messages)
        }, time)
      }
    })
  }

  /**
   * waits for a single component interaction on a specific message,
   * resolves with the ComponentContext if successful, or null if it timed out
   */
  async awaitComponent(messageId: string, options: AwaitComponentOptions = {}): Promise<ComponentContext | null> {

    const { filter, time = 15000 } = options

    return new Promise((resolve) => {

      let timeoutId: NodeJS.Timeout | null = null

      const handler = (data: import('../events/index.js').ChameleonEvent) => {

        if (data.type !== 'INTERACTION_CREATE') return
        const interaction = data.interaction
        const raw = interaction as unknown as Record<string, unknown>
        
        if (interaction.type !== INTERACTION_TYPES.MESSAGE_COMPONENT) return
        if (interaction.message?.id !== messageId) return

        const userRaw = interaction.member?.user || interaction.user
        const user = buildUser(userRaw as unknown as Record<string, unknown>)

        const ctx = new ComponentContext(
          this.client,
          raw,
          user,
          interaction.guildId ? resolveGuild(interaction.guildId, this.client) : undefined,
          interaction.channelId ? resolveChannel(interaction.channelId, this.client) : undefined
        )

        if (filter && !filter(ctx)) return

        cleanup()
        resolve(ctx)
      }

      const cleanup = () => {

        if (timeoutId) clearTimeout(timeoutId)

        this.client.off('INTERACTION_CREATE', handler)
      }

      this.client.on('INTERACTION_CREATE', handler)

      if (time > 0) {
        timeoutId = setTimeout(() => {
          cleanup()
          resolve(null)
        }, time)
      }
    })
  }
}