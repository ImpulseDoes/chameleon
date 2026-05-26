import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import { BaseInteractionContext } from './context.js'

export class ModalContext extends BaseInteractionContext {

  public customId: string
  private _fields: Map<string, string> = new Map()

  constructor(
    client: Client,
    raw: Record<string, unknown>,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {
    super(client, raw, user, guild, channel)
    this.customId = (raw.data as Record<string, unknown>)?.custom_id as string ?? ''

    // parse modal fields from action rows
    const rows = (raw.data as Record<string, unknown>)?.components as Record<string, unknown>[] ?? []
    for (const row of rows) {
      for (const comp of (row.components as Record<string, unknown>[]) ?? []) {
        if (comp.custom_id && comp.value !== undefined) {
          this._fields.set(comp.custom_id as string, comp.value as string)
        }
      }
    }
  }

  // Get a text input value by its customId
  // values from a select menu interaction
  get values(): string[] {
    return ((this as unknown) as Record<string, string[]>)._values ?? []
  }

  // Get all field values as a plain object
  get fields(): Record<string, string> {
    return Object.fromEntries(this._fields)
  }
}