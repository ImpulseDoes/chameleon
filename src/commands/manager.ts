import type { Client } from '../client/client.js'
import type { AnyCommandDef } from './command.js'
import { CommandContext } from './context.js'
import { ModalContext } from './interactions.js'
import { ComponentContext } from '../components/context.js'
import { resolveUser, resolveGuild, resolveChannel, resolveRole, buildUser } from '../builders/index.js'
import { COMMAND_OPTION_TYPES, INTERACTION_TYPES } from '../utils/constants.js'
import type { OptionType } from './options.js'

export interface ComponentHandler {
  type?: string
  customId?: string | RegExp
  execute?: (ctx: ComponentContext) => unknown | Promise<unknown>
}

export interface ModalHandler {
  customId: string | RegExp
  execute: (ctx: ModalContext) => unknown | Promise<unknown>
}

import * as fs from 'fs'
import * as path from 'path'

/** Shape of the `data` field inside a raw Discord interaction payload */
interface InteractionData {
  name?: string
  custom_id?: string
  component_type?: number
  options?: InteractionOption[]
  resolved?: {
    users?: Record<string, Record<string, unknown>>
    channels?: Record<string, Record<string, unknown>>
    roles?: Record<string, Record<string, unknown>>
    members?: Record<string, Record<string, unknown>>
  }
  values?: unknown[]
  components?: unknown[]
}

interface InteractionOption {
  name: string
  type: number
  value?: unknown
  options?: InteractionOption[]
}

export class CommandManager {

  private _commands = new Map<string, AnyCommandDef>()
  private _components: ComponentHandler[] = []
  private _modals: ModalHandler[] = []
  private _client: Client

  constructor(client: Client) {
    this._client = client
  }

  register(...commands: AnyCommandDef[]) {
    for (const cmd of commands) {
      this._commands.set(cmd.name, cmd)
    }

    this._deployCommands(commands).catch(console.error)
  }

  registerComponent(handler: ComponentHandler) {
    this._components.push(handler)
  }

  registerModal(handler: ModalHandler) {
    this._modals.push(handler)
  }

  async load(directory: string) {

    const fullPath = path.resolve(process.cwd(), directory)

    if (!fs.existsSync(fullPath)) {
      console.error(`[Chameleon] Command directory ${directory} does not exist.`)
      return
    }

    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))
    const commands: AnyCommandDef[] = []

    for (const file of files) {

      const filePath = path.join(fullPath, file)

      try {

        const module = await import(`file://${filePath}`)
        const command = module.default

        if (command && typeof command.name === 'string') {
          commands.push(command)
        }
      } catch (err) {
        console.error(`[Chameleon] Failed to load command from ${file}:`, err)
      }
    }

    if (commands.length > 0) {
      this.register(...commands)
    }
  }

  private async _deployCommands(commands: AnyCommandDef[]) {

    const payload = commands.map(c => this._transformCommand(c))

    // If client is already ready, deploy immediately
    if (this._client.user?.id) {
       await this._client.rest.put(`/applications/${this._client.user.id}/commands`, payload)
    } else {
      this._client.on('READY', async () => {
         await this._client.rest.put(`/applications/${this._client.user!.id}/commands`, payload)
      })
    }
  }

  private _transformCommand(cmd: AnyCommandDef) {

    const mapType = (t: string) => {
      switch(t) {
        case 'string': return 3
        case 'integer': return 4
        case 'boolean': return 5
        case 'user': return 6
        case 'channel': return 7
        case 'role': return 8
        case 'number': return 10
        default: return 3
      }
    }

    const options: unknown[] = []

    if (cmd.subcommands) {

      for (const [subName, subDef] of Object.entries(cmd.subcommands)) {

        const subOpts: unknown[] = []

        if (subDef.options) {
          for (const [optName, optDefRaw] of Object.entries(subDef.options)) {
             const optDef = optDefRaw as import('./options.js').OptionDef<OptionType, boolean>
             subOpts.push({
               type: mapType(optDef.type),
               name: optName,
               description: optDef.description,
               required: optDef.required,
               choices: optDef.choices,
               min_value: optDef.min,
               max_value: optDef.max
             })
          }
        }
        options.push({
          type: COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: subName,
          description: subDef.description,
          options: subOpts
        })
      }
    } else if (cmd.options) {
      for (const [optName, optDefRaw] of Object.entries(cmd.options)) {
        const optDef = optDefRaw as import('./options.js').OptionDef<OptionType, boolean>
        options.push({
           type: mapType(optDef.type),
           name: optName,
           description: optDef.description,
           required: optDef.required,
           choices: optDef.choices,
           min_value: optDef.min,
           max_value: optDef.max
        })
      }
    }

    return {
      name: cmd.name,
      description: cmd.description,
      options: options.length ? options : undefined
    }
  }

  public async handleInteraction(raw: Record<string, unknown>) {

    const data = raw.data as InteractionData | undefined
    if (!data) return

    if (raw.type === INTERACTION_TYPES.MESSAGE_COMPONENT) return this._handleComponentInteraction(raw, data)
    if (raw.type === INTERACTION_TYPES.MODAL_SUBMIT) return this._handleModalInteraction(raw, data)
    if (raw.type !== INTERACTION_TYPES.APPLICATION_COMMAND) return

    const name = data.name
    if (!name) return

    const command = this._commands.get(name)
    if (!command) return

    const parsedOptions: Record<string, unknown> = {}
    let targetExecute = command.execute

    const rawOptions = data.options || []

    let actualOptions: InteractionOption[] = rawOptions

    if (rawOptions.length > 0 && rawOptions[0]!.type === COMMAND_OPTION_TYPES.SUB_COMMAND) {
      const subcommandName = rawOptions[0]!.name
      actualOptions = rawOptions[0]!.options || []

      if (command.subcommands && command.subcommands[subcommandName]) {
        targetExecute = command.subcommands[subcommandName].execute
      }
    }

    for (const opt of actualOptions) {
      if (opt.type === COMMAND_OPTION_TYPES.USER && data.resolved?.users?.[opt.value as string]) {
        parsedOptions[opt.name] = resolveUser(opt.value as string, this._client)
      } else if (opt.type === COMMAND_OPTION_TYPES.CHANNEL && data.resolved?.channels?.[opt.value as string]) {
        parsedOptions[opt.name] = resolveChannel(opt.value as string, this._client)
      } else if (opt.type === COMMAND_OPTION_TYPES.ROLE && data.resolved?.roles?.[opt.value as string]) {
        parsedOptions[opt.name] = resolveRole(opt.value as string, this._client, raw.guild_id as string | undefined)
      } else {
        parsedOptions[opt.name] = opt.value
      }
    }

    const member = raw.member as Record<string, unknown> | undefined
    const userRaw = member?.user ?? raw.user

    const user = buildUser(userRaw as Record<string, unknown>)

    const ctx = new CommandContext(
      this._client,
      raw,
      parsedOptions,
      user,
      raw.guild_id ? resolveGuild(raw.guild_id as string, this._client) : undefined,
      raw.channel_id ? resolveChannel(raw.channel_id as string, this._client) : undefined
    )

    if (targetExecute) {
      try {
        await targetExecute(ctx as unknown)
      } catch (err) {
        console.error(`[Chameleon] Error executing command ${name}:`, err)
      }
    }
  }

  private async _handleComponentInteraction(raw: Record<string, unknown>, data: InteractionData) {

    const customId = data.custom_id
    const handler = this._components.find(h => {
      if (!h.customId) return false
      return typeof h.customId === 'string' ? h.customId === customId : h.customId.test(customId as string)
    })

    if (!handler) return

    const member = raw.member as Record<string, unknown> | undefined
    const userRaw = member?.user ?? raw.user
    const user = buildUser(userRaw as Record<string, unknown>)
    const ctx = new ComponentContext(
      this._client,
      raw,
      user,
      raw.guild_id ? resolveGuild(raw.guild_id as string, this._client) : undefined,
      raw.channel_id ? resolveChannel(raw.channel_id as string, this._client) : undefined
    )

    try {
      await handler.execute?.(ctx)
    } catch (err) {
      console.error(`[Chameleon] Error executing component ${customId}:`, err)
    }
  }

  private async _handleModalInteraction(raw: Record<string, unknown>, data: InteractionData) {

    const customId = data.custom_id
    const handler = this._modals.find(h => 
      typeof h.customId === 'string' ? h.customId === customId : h.customId.test(customId as string)
    )
    
    if (!handler) return

    const member = raw.member as Record<string, unknown> | undefined
    const userRaw = member?.user ?? raw.user
    const user = buildUser(userRaw as Record<string, unknown>)
    const ctx = new ModalContext(
      this._client,
      raw,
      user,
      raw.guild_id ? resolveGuild(raw.guild_id as string, this._client) : undefined,
      raw.channel_id ? resolveChannel(raw.channel_id as string, this._client) : undefined
    )

    try {
      await handler.execute?.(ctx)
    } catch (err) {
      console.error(`[Chameleon] Error executing modal ${customId}:`, err)
    }
  }
}