import type { Client } from '../client/client.js'
import type { AnyCommandDef, AnyCommandInput, Subcommand, SubcommandGroup } from './command.js'
import type { ModalDef, ResolveModalFields, AnyModalField } from '../components/define.js'
import type { ComponentContext } from '../components/context.js'
import { CommandContext } from './context.js'
import { ModalContext } from './interactions.js'
import { resolveUser, resolveGuild, resolveChannel, resolveRole, buildUser } from '../builders/index.js'
import { COMMAND_OPTION_TYPES, INTERACTION_TYPES } from '../utils/constants.js'
import type { OptionDef, OptionType } from './options.js'
import type { Attachment } from '../types/message/index.js'
import * as fs from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'

export interface ComponentHandler {
  type?: string
  customId?: string | RegExp
  execute?: (ctx: ComponentContext) => unknown | Promise<unknown>
}

export interface ModalHandler<Fields = Record<string, unknown>> {
  customId: string | RegExp
  execute: (ctx: ModalContext<Fields>) => unknown | Promise<unknown>
}

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
    attachments?: Record<string, Attachment>
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

type RuntimeOptionDef = OptionDef<OptionType, boolean>
type RuntimeSubcommand = Subcommand<Record<string, RuntimeOptionDef>>
type RuntimeSubcommandGroup = SubcommandGroup<Record<string, RuntimeSubcommand>>

function isSubcommandGroup(candidate: RuntimeSubcommand | RuntimeSubcommandGroup): candidate is RuntimeSubcommandGroup {
  return 'subcommands' in candidate
}

export class CommandManager {

  private _commands = new Map<string, AnyCommandDef>()
  private _globalCommands = new Map<string, AnyCommandDef>()
  private _guildCommands = new Map<string, Map<string, AnyCommandDef>>()
  private _modals: ModalHandler[] = []
  private _client: Client
  private _pendingGlobalDeploy = false
  private _pendingGuildDeploys = new Set<string>()
  private _readyDeployQueued = false

  constructor(client: Client) {
    this._client = client
  }

  register(...commands: AnyCommandInput[]) {
    const normalized = commands.map(cmd => this._normalizeCommand(cmd))

    for (const cmd of normalized) {
      this._commands.set(cmd.name, cmd)
      this._globalCommands.set(cmd.name, cmd)
    }

    this._scheduleDeploy().catch(console.error)
  }

  registerGuild(guildId: string, ...commands: AnyCommandInput[]) {
    
    const normalized = commands.map(cmd => this._normalizeCommand(cmd))
    const guildCommands = this._guildCommands.get(guildId) ?? new Map<string, AnyCommandDef>()

    for (const cmd of normalized) {
      this._commands.set(cmd.name, cmd)
      guildCommands.set(cmd.name, cmd)
    }

    this._guildCommands.set(guildId, guildCommands)
    this._scheduleDeploy(guildId).catch(console.error)
  }

  registerComponent(handler: ComponentHandler) {
    this._client.components.register(handler)
  }

  registerModal<F extends ReadonlyArray<AnyModalField>>(handler: ModalDef<F> | ModalHandler<ResolveModalFields<F>>) {
    this._modals.push(handler as ModalHandler)
  }

  async load(directory: string) {

    const fullPath = path.resolve(process.cwd(), directory)

    if (!fs.existsSync(fullPath)) {
      console.error(`[Chameleon] Command directory ${directory} does not exist.`)
      return
    }

    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))
    const commands: AnyCommandInput[] = []

    for (const file of files) {

      const filePath = path.join(fullPath, file)

      try {

        const module = await import(pathToFileURL(filePath).href)
        const command = module.default

        if (command && (typeof command.name === 'string' || typeof command.toCommand === 'function')) {
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

  private async _scheduleDeploy(guildId?: string): Promise<void> {

    if (this._client.user?.id) {
      await this._deployCommands(guildId)
      return
    }

    if (guildId) {
      this._pendingGuildDeploys.add(guildId)
    } else {
      this._pendingGlobalDeploy = true
    }

    if (this._readyDeployQueued) return

    this._readyDeployQueued = true

    this._client.once('READY', () => {
      this._flushPendingDeploys().catch(console.error)
    })
  }

  private async _flushPendingDeploys(): Promise<void> {

    this._readyDeployQueued = false

    const shouldDeployGlobal = this._pendingGlobalDeploy
    const guildIds = [...this._pendingGuildDeploys]

    this._pendingGlobalDeploy = false
    this._pendingGuildDeploys.clear()

    if (shouldDeployGlobal) {
      await this._deployCommands()
    }

    for (const guildId of guildIds) {
      await this._deployCommands(guildId)
    }
  }

  private async _deployCommands(guildId?: string): Promise<void> {

    const applicationId = this._client.user?.id
    
    if (!applicationId) return

    const commands = guildId
      ? [...(this._guildCommands.get(guildId)?.values() ?? [])]
      : [...this._globalCommands.values()]

    const payload = commands.map(c => this._transformCommand(c))
    const url = guildId
      ? `/applications/${applicationId}/guilds/${guildId}/commands`
      : `/applications/${applicationId}/commands`

    await this._client.rest.put(url, payload)
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
        case 'mentionable': return 9
        case 'number': return 10
        case 'attachment': return 11
        default: return 3
      }
    }

    const options: unknown[] = []

    if (cmd.subcommands) {

      for (const [subName, subDefRaw] of Object.entries(cmd.subcommands)) {

        const candidate = subDefRaw as RuntimeSubcommand | RuntimeSubcommandGroup

        if (isSubcommandGroup(candidate)) {

          const nested = Object.entries(candidate.subcommands).map(([nestedName, nestedDefRaw]) => {
          
            const nestedDef = nestedDefRaw as RuntimeSubcommand
            const nestedOptions = nestedDef.options ? Object.entries(nestedDef.options).map(([optName, optDefRaw]) => {
          
              const optDef = optDefRaw as RuntimeOptionDef
          
              return {
                type: mapType(optDef.type),
                name: optName,
                description: optDef.description,
                required: optDef.required,
                choices: optDef.choices,
                channel_types: optDef.channelTypes,
                min_value: optDef.min,
                max_value: optDef.max,
                min_length: optDef.minLength,
                max_length: optDef.maxLength
              }
            }) : []

            return {
              type: COMMAND_OPTION_TYPES.SUB_COMMAND,
              name: nestedName,
              description: nestedDef.description,
              options: nestedOptions
            }
          })

          options.push({
            type: COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
            name: subName,
            description: candidate.description,
            options: nested
          })
          continue
        }

        const subDef = candidate as RuntimeSubcommand

        const subOpts: unknown[] = []

        if (subDef.options) {

          for (const [optName, optDefRaw] of Object.entries(subDef.options)) {
          
            const optDef = optDefRaw as RuntimeOptionDef
          
            subOpts.push({
               type: mapType(optDef.type),
               name: optName,
               description: optDef.description,
               required: optDef.required,
               choices: optDef.choices,
               channel_types: optDef.channelTypes,
               min_value: optDef.min,
               max_value: optDef.max,
               min_length: optDef.minLength,
               max_length: optDef.maxLength
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
      
        const optDef = optDefRaw as RuntimeOptionDef
      
        options.push({
           type: mapType(optDef.type),
           name: optName,
           description: optDef.description,
           required: optDef.required,
           choices: optDef.choices,
           channel_types: optDef.channelTypes,
           min_value: optDef.min,
           max_value: optDef.max,
           min_length: optDef.minLength,
           max_length: optDef.maxLength
        })
      }
    }

    return {
      name: cmd.name,
      description: cmd.description,
      default_member_permissions: cmd.defaultMemberPermissions ?? undefined,
      options: options.length ? options : undefined
    }
  }

  private _normalizeCommand(command: AnyCommandInput): AnyCommandDef {

    if (typeof (command as { toCommand?: () => AnyCommandDef }).toCommand === 'function') {
      return (command as { toCommand(): AnyCommandDef }).toCommand()
    }

    return command as AnyCommandDef
  }

  public async handleInteraction(raw: Record<string, unknown>) {

    const data = raw.data as InteractionData | undefined
    if (!data) return

    if (raw.type === INTERACTION_TYPES.MESSAGE_COMPONENT) return this._client.components.handleInteraction(raw)
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

    if (rawOptions.length > 0 && rawOptions[0]!.type === COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP) {

      const groupName = rawOptions[0]!.name
      const groupOption = rawOptions[0]!
      const nestedSubcommand = groupOption.options?.[0]

      if (nestedSubcommand) {
        actualOptions = nestedSubcommand.options || []

        const group = command.subcommands?.[groupName] as { subcommands?: Record<string, { execute?: typeof targetExecute }> } | undefined
        const targetSubcommand = group?.subcommands?.[nestedSubcommand.name]
        if (targetSubcommand) {
          targetExecute = targetSubcommand.execute
        }
      }
    } else if (rawOptions.length > 0 && rawOptions[0]!.type === COMMAND_OPTION_TYPES.SUB_COMMAND) {
      const subcommandName = rawOptions[0]!.name
      actualOptions = rawOptions[0]!.options || []

      if (command.subcommands && command.subcommands[subcommandName]) {
        targetExecute = (command.subcommands[subcommandName] as { execute?: typeof targetExecute }).execute
      }
    }

    for (const opt of actualOptions) {
      if (opt.type === COMMAND_OPTION_TYPES.USER && data.resolved?.users?.[opt.value as string]) {
        parsedOptions[opt.name] = resolveUser(opt.value as string, this._client)
      } else if (opt.type === COMMAND_OPTION_TYPES.CHANNEL && data.resolved?.channels?.[opt.value as string]) {
        parsedOptions[opt.name] = resolveChannel(opt.value as string, this._client)
      } else if (opt.type === COMMAND_OPTION_TYPES.ROLE && data.resolved?.roles?.[opt.value as string]) {
        parsedOptions[opt.name] = resolveRole(opt.value as string, this._client, raw.guild_id as string | undefined)
      } else if (opt.type === COMMAND_OPTION_TYPES.MENTIONABLE) {
        if (data.resolved?.users?.[opt.value as string]) {
          parsedOptions[opt.name] = resolveUser(opt.value as string, this._client)
        } else if (data.resolved?.roles?.[opt.value as string]) {
          parsedOptions[opt.name] = resolveRole(opt.value as string, this._client, raw.guild_id as string | undefined)
        } else {
          parsedOptions[opt.name] = opt.value
        }
      } else if (opt.type === COMMAND_OPTION_TYPES.ATTACHMENT && data.resolved?.attachments?.[opt.value as string]) {
        parsedOptions[opt.name] = data.resolved.attachments[opt.value as string]
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
    
      const cancelAutoDefer = raw.type === INTERACTION_TYPES.APPLICATION_COMMAND
        ? this._scheduleAutoDefer(ctx)
        : () => {}


      try {
        await (targetExecute as (ctx: CommandContext<Record<string, unknown>>) => void | Promise<void>)(ctx)
      } catch (err) {
        console.error(`[Chameleon] Error executing command ${name}:`, err)
      } finally {
        cancelAutoDefer()
      }
    }
  }

  private _scheduleAutoDefer(ctx: CommandContext<Record<string, unknown>>): () => void {

    const autoDefer = this._client.autoDefer

    if (!autoDefer) return () => {}

    const timer = setTimeout(() => {
      if (ctx.replied || ctx.deferred) return
      ctx.defer({ ephemeral: autoDefer.ephemeral }).catch(() => {})
    }, autoDefer.timeout)

    return () => clearTimeout(timer)
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