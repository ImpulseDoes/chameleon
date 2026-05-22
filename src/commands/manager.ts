import type { Client } from '../client/client.js'
import type { CommandDef } from './command.js'
import { CommandContext } from './context.js'
import { ComponentContext, ModalContext } from './interactions.js'
import { resolveUser, resolveGuild, resolveChannel, resolveRole, buildUser } from '../builders/index.js'

export interface ComponentHandler {
  customId: string | RegExp
  execute: (ctx: ComponentContext) => any | Promise<any>
}

export interface ModalHandler {
  customId: string | RegExp
  execute: (ctx: ModalContext) => any | Promise<any>
}

import * as fs from 'fs'
import * as path from 'path'

export class CommandManager {

  private _commands = new Map<string, CommandDef<any, any>>()
  private _components: ComponentHandler[] = []
  private _modals: ModalHandler[] = []
  private _client: Client

  constructor(client: Client) {
    this._client = client
  }

  register(...commands: CommandDef<any, any>[]) {
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
    const commands: CommandDef<any, any>[] = []

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

  private async _deployCommands(commands: CommandDef<any, any>[]) {

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

  private _transformCommand(cmd: CommandDef<any, any>) {

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

    const options: any[] = []

    if (cmd.subcommands) {

      for (const [subName, subDefRaw] of Object.entries(cmd.subcommands)) {

        const subDef = subDefRaw as any
        const subOpts: any[] = []

        if (subDef.options) {
          for (const [optName, optDef] of Object.entries(subDef.options)) {
             subOpts.push({
               type: mapType((optDef as any).type),
               name: optName,
               description: (optDef as any).description,
               required: (optDef as any).required,
               choices: (optDef as any).choices,
               min_value: (optDef as any).min,
               max_value: (optDef as any).max
             })
          }
        }
        options.push({
          type: 1, // SUB_COMMAND
          name: subName,
          description: subDef.description,
          options: subOpts
        })
      }
    } else if (cmd.options) {
      for (const [optName, optDef] of Object.entries(cmd.options)) {
        options.push({
           type: mapType((optDef as any).type),
           name: optName,
           description: (optDef as any).description,
           required: (optDef as any).required,
           choices: (optDef as any).choices,
           min_value: (optDef as any).min,
           max_value: (optDef as any).max
        })
      }
    }

    return {
      name: cmd.name,
      description: cmd.description,
      options: options.length ? options : undefined
    }
  }

  public async handleInteraction(raw: any) {

    if (raw.type === 3) return this._handleComponentInteraction(raw)
    if (raw.type === 5) return this._handleModalInteraction(raw)
    if (raw.type !== 2) return // Only handle Application Commands below

    const name = raw.data.name
    const command = this._commands.get(name)
    if (!command) return

    let parsedOptions: Record<string, any> = {}
    let targetExecute = command.execute

    const rawOptions = raw.data.options || []

    let actualOptions = rawOptions

    if (rawOptions.length > 0 && rawOptions[0].type === 1) { // SUB_COMMAND
      const subcommandName = rawOptions[0].name
      actualOptions = rawOptions[0].options || []

      if (command.subcommands && command.subcommands[subcommandName]) {
        targetExecute = command.subcommands[subcommandName].execute
      }
    }

    for (const opt of actualOptions) {
      if (opt.type === 6 && raw.data.resolved?.users?.[opt.value]) { // User
        parsedOptions[opt.name] = resolveUser(opt.value, this._client.cache)
      } else if (opt.type === 7 && raw.data.resolved?.channels?.[opt.value]) { // Channel
        parsedOptions[opt.name] = resolveChannel(opt.value, this._client.cache)
      } else if (opt.type === 8 && raw.data.resolved?.roles?.[opt.value]) { // Role
        parsedOptions[opt.name] = resolveRole(opt.value, this._client.cache)
      } else {
        parsedOptions[opt.name] = opt.value
      }
    }

    const member = raw.member || {}
    const userRaw = member.user || raw.user

    const user = buildUser(userRaw)

    const ctx = new CommandContext(
      this._client,
      raw,
      parsedOptions,
      user,
      raw.guild_id ? resolveGuild(raw.guild_id, this._client.cache) : undefined,
      raw.channel_id ? resolveChannel(raw.channel_id, this._client.cache) : undefined
    )

    if (targetExecute) {
      try {
        await targetExecute(ctx)
      } catch (err) {
        console.error(`[Chameleon] Error executing command ${name}:`, err)
      }
    }
  }

  private async _handleComponentInteraction(raw: any) {

    const customId = raw.data.custom_id
    const handler = this._components.find(h => 
      typeof h.customId === 'string' ? h.customId === customId : h.customId.test(customId)
    )

    if (!handler) return

    const userRaw = raw.member?.user || raw.user
    const user = buildUser(userRaw)
    const ctx = new ComponentContext(
      this._client,
      raw,
      user,
      raw.guild_id ? resolveGuild(raw.guild_id, this._client.cache) : undefined,
      raw.channel_id ? resolveChannel(raw.channel_id, this._client.cache) : undefined
    )

    if (raw.data.component_type === 3 || raw.data.component_type === 5 || raw.data.component_type === 6 || raw.data.component_type === 7 || raw.data.component_type === 8) {
      (ctx as any)._values = raw.data.values || []
    }

    try {
      await handler.execute(ctx)
    } catch (err) {
      console.error(`[Chameleon] Error executing component ${customId}:`, err)
    }
  }

  private async _handleModalInteraction(raw: any) {

    const customId = raw.data.custom_id
    const handler = this._modals.find(h => 
      typeof h.customId === 'string' ? h.customId === customId : h.customId.test(customId)
    )
    
    if (!handler) return

    const userRaw = raw.member?.user || raw.user
    const user = buildUser(userRaw)
    const ctx = new ModalContext(
      this._client,
      raw,
      user,
      raw.guild_id ? resolveGuild(raw.guild_id, this._client.cache) : undefined,
      raw.channel_id ? resolveChannel(raw.channel_id, this._client.cache) : undefined
    )

    try {
      await handler.execute(ctx)
    } catch (err) {
      console.error(`[Chameleon] Error executing modal ${customId}:`, err)
    }
  }
}