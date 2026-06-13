import { opt, type ChoiceDef, type OptionDef, type ResolveOptions, type OptionType } from './options.js'
import type { CommandContext } from './context.js'

type CommandOptionMap = Record<string, OptionDef<OptionType, boolean>>
type SubcommandMap = Record<string, Subcommand<CommandOptionMap>>

export type ExecuteFunction<O extends Record<string, OptionDef<OptionType, boolean>>> = (ctx: CommandContext<ResolveOptions<O>>) => void | Promise<void>

export interface Subcommand<O extends CommandOptionMap = Record<string, never>> {
  description: string
  options?: O
  execute: ExecuteFunction<O>
}

export function defineSubcommand<O extends CommandOptionMap>(def: Subcommand<O>): Subcommand<O> {
  return def
}

export type CommandDef<
  O extends CommandOptionMap = Record<string, never>,
  S extends SubcommandMap = Record<string, never>
> = {
  name: string
  description: string
  options?: O
  subcommands?: S
  execute?: ExecuteFunction<O>
}

export type AnyCommandDef = CommandDef<any, any>
export type AnyCommandInput = CommandDef<any, any> | CommandDefinitionBuilder<any, any>

export function defineCommand<
  O extends CommandOptionMap,
  S extends SubcommandMap
>(def: CommandDef<O, S>): CommandDef<O, S> {

  if (!def.execute && (!def.subcommands || Object.keys(def.subcommands).length === 0)) {
    throw new Error(`Command ${def.name} must have an execute function or subcommands.`)
  }
  return def
}

function appendOption<
  O extends CommandOptionMap,
  Name extends string,
  Def extends OptionDef<OptionType, boolean>
>(optionsDef: O | undefined, name: Name, definition: Def): O & Record<Name, Def> {
  return {
    ...(optionsDef ?? {} as O),
    [name]: definition
  } as O & Record<Name, Def>
}

function normalizeChoicesOptions<R extends boolean, V extends string | number, Extra extends Record<string, unknown>>(
  choicesOrOptions: ChoiceDef<V>[] | undefined | (Extra & { required?: R }),
  maybeOptions: Extra & { required?: R } | undefined
): (Extra & { required?: R, choices?: ChoiceDef<V>[] }) | undefined {
  if (Array.isArray(choicesOrOptions)) {
    return {
      ...(maybeOptions ?? {} as Extra & { required?: R }),
      choices: choicesOrOptions
    }
  }

  return choicesOrOptions
}

export class SubcommandDefinitionBuilder<O extends CommandOptionMap = Record<string, never>> {

  constructor(
    private readonly description: string,
    private readonly optionsDef?: O
  ) {}

  options<NewOptions extends CommandOptionMap>(options: NewOptions): SubcommandDefinitionBuilder<NewOptions> {
    return new SubcommandDefinitionBuilder(this.description, options)
  }

  option<Name extends string, Def extends OptionDef<OptionType, boolean>>(
    name: Name,
    definition: Def
  ): SubcommandDefinitionBuilder<O & Record<Name, Def>> {
    return new SubcommandDefinitionBuilder(
      this.description,
      appendOption(this.optionsDef, name, definition)
    )
  }

  string<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: ChoiceDef<string>[] | { required?: R, choices?: ChoiceDef<string>[], minLength?: number, maxLength?: number },
    maybeOptions?: { required?: R, minLength?: number, maxLength?: number }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'string', R>>> {
    return this.option(name, opt.string(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  integer<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: ChoiceDef<number>[] | { required?: R, choices?: ChoiceDef<number>[], min?: number, max?: number },
    maybeOptions?: { required?: R, min?: number, max?: number }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'integer', R>>> {
    return this.option(name, opt.integer(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  number<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: ChoiceDef<number>[] | { required?: R, choices?: ChoiceDef<number>[], min?: number, max?: number },
    maybeOptions?: { required?: R, min?: number, max?: number }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'number', R>>> {
    return this.option(name, opt.number(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  boolean<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'boolean', R>>> {
    return this.option(name, opt.boolean(description, options))
  }

  user<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'user', R>>> {
    return this.option(name, opt.user(description, options))
  }

  channel<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'channel', R>>> {
    return this.option(name, opt.channel(description, options))
  }

  role<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'role', R>>> {
    return this.option(name, opt.role(description, options))
  }

  execute(execute: ExecuteFunction<O>): Subcommand<O> {
    return defineSubcommand({
      description: this.description,
      ...(this.optionsDef ? { options: this.optionsDef } : {}),
      execute
    } as Subcommand<O>)
  }

  handle(execute: ExecuteFunction<O>): Subcommand<O> {
    return this.execute(execute)
  }
}

export class CommandDefinitionBuilder<
  O extends CommandOptionMap = Record<string, never>,
  S extends SubcommandMap = Record<string, never>
> {
  constructor(
    private readonly name: string,
    private readonly description: string,
    private readonly optionsDef?: O,
    private readonly subcommandsDef?: S
  ) {}

  options<NewOptions extends CommandOptionMap>(options: NewOptions): CommandDefinitionBuilder<NewOptions, S> {
    return new CommandDefinitionBuilder(this.name, this.description, options, this.subcommandsDef)
  }

  option<Name extends string, Def extends OptionDef<OptionType, boolean>>(
    name: Name,
    definition: Def
  ): CommandDefinitionBuilder<O & Record<Name, Def>, S> {
    return new CommandDefinitionBuilder(
      this.name,
      this.description,
      appendOption(this.optionsDef, name, definition),
      this.subcommandsDef
    )
  }

  string<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: ChoiceDef<string>[] | { required?: R, choices?: ChoiceDef<string>[], minLength?: number, maxLength?: number },
    maybeOptions?: { required?: R, minLength?: number, maxLength?: number }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'string', R>>, S> {
    return this.option(name, opt.string(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  integer<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: ChoiceDef<number>[] | { required?: R, choices?: ChoiceDef<number>[], min?: number, max?: number },
    maybeOptions?: { required?: R, min?: number, max?: number }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'integer', R>>, S> {
    return this.option(name, opt.integer(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  number<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: ChoiceDef<number>[] | { required?: R, choices?: ChoiceDef<number>[], min?: number, max?: number },
    maybeOptions?: { required?: R, min?: number, max?: number }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'number', R>>, S> {
    return this.option(name, opt.number(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  boolean<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'boolean', R>>, S> {
    return this.option(name, opt.boolean(description, options))
  }

  user<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'user', R>>, S> {
    return this.option(name, opt.user(description, options))
  }

  channel<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'channel', R>>, S> {
    return this.option(name, opt.channel(description, options))
  }

  role<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'role', R>>, S> {
    return this.option(name, opt.role(description, options))
  }

  subcommands<NewSubcommands extends SubcommandMap>(subcommands: NewSubcommands): CommandDefinitionBuilder<O, NewSubcommands> {
    return new CommandDefinitionBuilder(this.name, this.description, this.optionsDef, subcommands)
  }

  subcommand<Name extends string, Sub extends Subcommand<CommandOptionMap>>(
    name: Name,
    subcommand: Sub
  ): CommandDefinitionBuilder<O, S & Record<Name, Sub>> {
    return new CommandDefinitionBuilder(
      this.name,
      this.description,
      this.optionsDef,
      {
        ...(this.subcommandsDef ?? {} as S),
        [name]: subcommand
      } as S & Record<Name, Sub>
    )
  }

  execute(execute: ExecuteFunction<O>): CommandDef<O, S> {
    return defineCommand({
      name: this.name,
      description: this.description,
      ...(this.optionsDef ? { options: this.optionsDef } : {}),
      ...(this.subcommandsDef ? { subcommands: this.subcommandsDef } : {}),
      execute
    } as CommandDef<O, S>)
  }

  handle(execute: ExecuteFunction<O>): CommandDef<O, S> {
    return this.execute(execute)
  }

  toCommand(): CommandDef<O, S> {
    return defineCommand({
      name: this.name,
      description: this.description,
      ...(this.optionsDef ? { options: this.optionsDef } : {}),
      ...(this.subcommandsDef ? { subcommands: this.subcommandsDef } : {})
    } as CommandDef<O, S>)
  }

  build(): CommandDef<O, S> {
    return this.toCommand()
  }
}

/**
 * Start a fluent command definition
 */
export function command(name: string, description: string) {
  return new CommandDefinitionBuilder(name, description)
}

/**
 * Start a fluent subcommand definition
 */
export function subcommand(description: string) {
  return new SubcommandDefinitionBuilder(description)
}