import type { Client } from '../client/client.js'
import type { User } from '../types/user/index.js'
import type { Guild } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import type { Attachment } from '../types/message/index.js'
import { BaseInteractionContext } from './context.js'

export class ModalContext<Fields = Record<string, unknown>> extends BaseInteractionContext {

  public customId: string
  public attachments: Record<string, Attachment[]> = {}
  private _fields: Map<string, unknown> = new Map()

  constructor(
    client: Client,
    raw: Record<string, unknown>,
    user: User,
    guild?: Guild | { id: string },
    channel?: Channel | { id: string }
  ) {

    super(client, raw, user, guild, channel)
    const data = (raw.data as Record<string, unknown>) ?? {}
    this.customId = data.custom_id as string ?? ''

    const rows = data.components as Record<string, unknown>[] ?? []
    const resolvedAttachments = ((data.resolved as Record<string, unknown> | undefined)?.attachments ?? {}) as Record<string, Attachment>

    const extractFields = (components: Record<string, unknown>[]) => {

      for (const comp of components) {
      
        if (comp.custom_id) {
      
          if (comp.values !== undefined) {
            this._fields.set(comp.custom_id as string, comp.values)

            if (Array.isArray(comp.values)) {
              this.attachments[comp.custom_id as string] = (comp.values as string[])
                .map(id => resolvedAttachments[id])
                .filter((attachment): attachment is Attachment => attachment !== undefined)
            }
          } else if (comp.value !== undefined) {
            this._fields.set(comp.custom_id as string, comp.value)
          }
        }

        if (Array.isArray(comp.components)) {
          extractFields(comp.components as Record<string, unknown>[])
        }

        if (comp.component && typeof comp.component === 'object') {
          extractFields([comp.component as Record<string, unknown>])
        }
      }
    }

    extractFields(rows)
  }

  // Get a text input value by its customId
  // values from a select menu interaction
  get values(): string[] {
    return ((this as unknown) as Record<string, string[]>)._values ?? []
  }

  // Get all field values as a plain object
  get fields(): Fields {
    return Object.fromEntries(this._fields) as Fields
  }
}