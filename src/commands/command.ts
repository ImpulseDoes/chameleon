import type { OptionDef, ResolveOptions } from './options.js'
import type { CommandContext } from './context.js'

export type ExecuteFunction<O extends Record<string, OptionDef<any, boolean>>> = (ctx: CommandContext<ResolveOptions<O>>) => void | Promise<void>

export interface Subcommand<O extends Record<string, OptionDef<any, boolean>> = Record<string, never>> {
  description: string
  options?: O
  execute: ExecuteFunction<O>
}

export function defineSubcommand<O extends Record<string, OptionDef<any, boolean>>>(def: Subcommand<O>): Subcommand<O> {
  return def
}

export type CommandDef<
  O extends Record<string, OptionDef<any, boolean>> = Record<string, never>,
  S extends Record<string, Subcommand<any>> = Record<string, never>
> = {
  name: string
  description: string
  options?: O
  subcommands?: S
  execute?: ExecuteFunction<O>
}

export function defineCommand<
  O extends Record<string, OptionDef<any, boolean>>,
  S extends Record<string, Subcommand<any>>
>(def: CommandDef<O, S>): CommandDef<O, S> {

  if (!def.execute && (!def.subcommands || Object.keys(def.subcommands).length === 0)) {
    throw new Error(`Command ${def.name} must have an execute function or subcommands.`)
  }
  return def
}