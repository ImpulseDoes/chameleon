import { opt, type ChoiceDef, type OptionDef, type ResolveOptions, type OptionType } from './options.js'
import type { CommandContext } from './context.js'
import type { BitFieldResolvable } from '../utils/bitfield.js'
import { PermissionsBitField } from '../types/permissions.js'

type CommandOptionMap = Record<string, OptionDef<OptionType, boolean>>
type SubcommandMap = Record<string, Subcommand<CommandOptionMap>>
type SubcommandGroupMap = Record<string, SubcommandGroup<SubcommandMap>>

export type ExecuteFunction<O extends Record<string, OptionDef<OptionType, boolean>>> = (ctx: CommandContext<ResolveOptions<O>>) => void | Promise<void>

export interface Subcommand<O extends CommandOptionMap = Record<string, never>> {
  description: string
  options?: O
  execute: ExecuteFunction<O>
}

export function defineSubcommand<O extends CommandOptionMap>(def: Subcommand<O>): Subcommand<O> {
  return def
}

export interface SubcommandGroup<S extends SubcommandMap = Record<string, never>> {
  description: string
  subcommands: S
}

export function defineSubcommandGroup<S extends SubcommandMap>(def: SubcommandGroup<S>): SubcommandGroup<S> {
  return def
}

export type CommandDef<
  O extends CommandOptionMap = Record<string, never>,
  S extends SubcommandMap | SubcommandGroupMap = Record<string, never>
> = {
  name: string
  description: string
  options?: O
  subcommands?: S
  defaultMemberPermissions?: string | null
  execute?: ExecuteFunction<O>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySubcommand = Subcommand<any>
type AnySubcommandGroup = SubcommandGroup<SubcommandMap>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCommandDef = CommandDef<any, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCommandInput = CommandDef<any, any> | CommandDefinitionBuilder<any, any>

export function defineCommand<
  O extends CommandOptionMap,
  S extends SubcommandMap | SubcommandGroupMap
>(def: CommandDef<O, S>): CommandDef<O, S> {

  if (!def.execute && (!def.subcommands || Object.keys(def.subcommands).length === 0)) {
    throw new Error(`Command ${def.name} must have an execute function or subcommands.`)
  }
  return def
}

interface CommandMetadata {
  defaultMemberPermissions?: string | null
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
  choicesOrOptions: readonly ChoiceDef<V>[] | undefined | (Extra & { required?: R }),
  maybeOptions: Extra & { required?: R } | undefined
): (Extra & { required?: R, choices?: readonly ChoiceDef<V>[] }) | undefined {
  if (Array.isArray(choicesOrOptions)) {
    return {
      ...(maybeOptions ?? {} as Extra & { required?: R }),
      choices: choicesOrOptions
    }
  }

  if (choicesOrOptions) {
    return choicesOrOptions as Extra & { required?: R, choices?: readonly ChoiceDef<V>[] }
  }

  return undefined
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
    choicesOrOptions?: readonly ChoiceDef<string>[] | { required?: R, choices?: readonly ChoiceDef<string>[], minLength?: number, maxLength?: number },
    maybeOptions?: { required?: R, minLength?: number, maxLength?: number }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'string', R>>> {
    return this.option(name, opt.string(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  integer<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: readonly ChoiceDef<number>[] | { required?: R, choices?: readonly ChoiceDef<number>[], min?: number, max?: number },
    maybeOptions?: { required?: R, min?: number, max?: number }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'integer', R>>> {
    return this.option(name, opt.integer(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  number<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: readonly ChoiceDef<number>[] | { required?: R, choices?: readonly ChoiceDef<number>[], min?: number, max?: number },
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
    options?: { required?: R, channelTypes?: number[] }
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

  mentionable<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'mentionable', R>>> {
    return this.option(name, opt.mentionable(description, options))
  }

  attachment<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): SubcommandDefinitionBuilder<O & Record<Name, OptionDef<'attachment', R>>> {
    return this.option(name, opt.attachment(description, options))
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

export class SubcommandGroupDefinitionBuilder<S extends SubcommandMap = Record<string, never>> {
  constructor(
    private readonly description: string,
    private readonly subcommandsDef?: S
  ) {}

  subcommands<NewSubcommands extends SubcommandMap>(subcommands: NewSubcommands): SubcommandGroupDefinitionBuilder<NewSubcommands> {
    return new SubcommandGroupDefinitionBuilder(this.description, subcommands)
  }

  subcommand<Name extends string, Sub extends AnySubcommand>(
    name: Name,
    subcommand: Sub
  ): SubcommandGroupDefinitionBuilder<S & Record<Name, Sub>> {
    return new SubcommandGroupDefinitionBuilder(
      this.description,
      {
        ...(this.subcommandsDef ?? {} as S),
        [name]: subcommand
      } as S & Record<Name, Sub>
    )
  }

  toGroup(): SubcommandGroup<S> {
    return defineSubcommandGroup({
      description: this.description,
      subcommands: (this.subcommandsDef ?? {} as S)
    })
  }

  build(): SubcommandGroup<S> {
    return this.toGroup()
  }
}

export class CommandDefinitionBuilder<
  O extends CommandOptionMap = Record<string, never>,
  S extends SubcommandMap | SubcommandGroupMap = Record<string, never>
> {
  constructor(
    private readonly name: string,
    private readonly description: string,
    private readonly optionsDef?: O,
    private readonly subcommandsDef?: S,
    private readonly metadata: CommandMetadata = {}
  ) {}

  options<NewOptions extends CommandOptionMap>(options: NewOptions): CommandDefinitionBuilder<NewOptions, S> {
    return new CommandDefinitionBuilder(this.name, this.description, options, this.subcommandsDef, this.metadata)
  }

  option<Name extends string, Def extends OptionDef<OptionType, boolean>>(
    name: Name,
    definition: Def
  ): CommandDefinitionBuilder<O & Record<Name, Def>, S> {
    return new CommandDefinitionBuilder(
      this.name,
      this.description,
      appendOption(this.optionsDef, name, definition),
      this.subcommandsDef,
      this.metadata
    )
  }

  string<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: readonly ChoiceDef<string>[] | { required?: R, choices?: readonly ChoiceDef<string>[], minLength?: number, maxLength?: number },
    maybeOptions?: { required?: R, minLength?: number, maxLength?: number }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'string', R>>, S> {
    return this.option(name, opt.string(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  integer<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: readonly ChoiceDef<number>[] | { required?: R, choices?: readonly ChoiceDef<number>[], min?: number, max?: number },
    maybeOptions?: { required?: R, min?: number, max?: number }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'integer', R>>, S> {
    return this.option(name, opt.integer(description, normalizeChoicesOptions(choicesOrOptions, maybeOptions)))
  }

  number<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    choicesOrOptions?: readonly ChoiceDef<number>[] | { required?: R, choices?: readonly ChoiceDef<number>[], min?: number, max?: number },
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
    options?: { required?: R, channelTypes?: number[] }
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

  mentionable<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'mentionable', R>>, S> {
    return this.option(name, opt.mentionable(description, options))
  }

  attachment<Name extends string, R extends boolean = false>(
    name: Name,
    description: string,
    options?: { required?: R }
  ): CommandDefinitionBuilder<O & Record<Name, OptionDef<'attachment', R>>, S> {
    return this.option(name, opt.attachment(description, options))
  }

  subcommands<NewSubcommands extends SubcommandMap | SubcommandGroupMap>(subcommands: NewSubcommands): CommandDefinitionBuilder<O, NewSubcommands> {
    return new CommandDefinitionBuilder(this.name, this.description, this.optionsDef, subcommands, this.metadata)
  }

  subcommand<Name extends string, Sub extends AnySubcommand>(
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
      } as S & Record<Name, Sub>,
      this.metadata
    )
  }

  group<Name extends string, Group extends AnySubcommandGroup | SubcommandGroupDefinitionBuilder<SubcommandMap>>(
    name: Name,
    group: Group
  ): CommandDefinitionBuilder<
    O,
    S & Record<
      Name,
      Group extends SubcommandGroupDefinitionBuilder<infer GS> ? SubcommandGroup<GS> : Group
    >
  > {
    const normalized = typeof (group as { toGroup?: () => SubcommandGroup<SubcommandMap> }).toGroup === 'function'
      ? (group as { toGroup(): SubcommandGroup<SubcommandMap> }).toGroup()
      : group as SubcommandGroup<SubcommandMap>

    return new CommandDefinitionBuilder(
      this.name,
      this.description,
      this.optionsDef,
      {
        ...(this.subcommandsDef ?? {} as S),
        [name]: normalized
      } as S & Record<
        Name,
        Group extends SubcommandGroupDefinitionBuilder<infer GS> ? SubcommandGroup<GS> : Group
      >,
      this.metadata
    )
  }

  setPermissions(permissions: BitFieldResolvable | null): CommandDefinitionBuilder<O, S> {
    return new CommandDefinitionBuilder(
      this.name,
      this.description,
      this.optionsDef,
      this.subcommandsDef,
      {
        ...this.metadata,
        defaultMemberPermissions: permissions === null
          ? null
          : PermissionsBitField.resolve(permissions).toString()
      }
    )
  }

  setDefaultMemberPermissions(permissions: BitFieldResolvable | null): CommandDefinitionBuilder<O, S> {
    return this.setPermissions(permissions)
  }

  execute(execute: ExecuteFunction<O>): CommandDef<O, S> {
    return defineCommand({
      name: this.name,
      description: this.description,
      ...(this.optionsDef ? { options: this.optionsDef } : {}),
      ...(this.subcommandsDef ? { subcommands: this.subcommandsDef } : {}),
      ...(this.metadata.defaultMemberPermissions !== undefined ? { defaultMemberPermissions: this.metadata.defaultMemberPermissions } : {}),
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
      ...(this.subcommandsDef ? { subcommands: this.subcommandsDef } : {}),
      ...(this.metadata.defaultMemberPermissions !== undefined ? { defaultMemberPermissions: this.metadata.defaultMemberPermissions } : {})
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

/**
 * Start a fluent subcommand group definition
 */
export function subcommandGroup(description: string) {
  return new SubcommandGroupDefinitionBuilder(description)
}