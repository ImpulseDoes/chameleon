import type { OptionDef, ResolveOptions, OptionType } from './options.js'
import type { CommandContext } from './context.js'

export type ExecuteFunction<O extends Record<string, OptionDef<OptionType, boolean>>> = (ctx: CommandContext<ResolveOptions<O>>) => void | Promise<void>

export interface Subcommand<O extends Record<string, OptionDef<OptionType, boolean>> = Record<string, never>> {
  description: string
  options?: O
  execute: ExecuteFunction<O>
}

export function defineSubcommand<O extends Record<string, OptionDef<OptionType, boolean>>>(def: Subcommand<O>): Subcommand<O> {
  return def
}

export type CommandDef<
  O extends Record<string, OptionDef<OptionType, boolean>> = Record<string, never>,
  S extends Record<string, Subcommand<Record<string, OptionDef<OptionType, boolean>>>> = Record<string, never>
> = {
  name: string
  description: string
  options?: O
  subcommands?: S
  execute?: ExecuteFunction<O>
}

export type AnyCommandDef = CommandDef<Record<string, OptionDef<OptionType, boolean>>, Record<string, Subcommand<Record<string, OptionDef<OptionType, boolean>>>>>

export function defineCommand<
  O extends Record<string, OptionDef<OptionType, boolean>>,
  S extends Record<string, Subcommand<Record<string, OptionDef<OptionType, boolean>>>>
>(def: CommandDef<O, S>): CommandDef<O, S> {

  if (!def.execute && (!def.subcommands || Object.keys(def.subcommands).length === 0)) {
    throw new Error(`Command ${def.name} must have an execute function or subcommands.`)
  }
  return def
}