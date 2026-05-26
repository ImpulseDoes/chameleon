import type { User } from '../types/user/index.js'
import type { Role } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'

export type OptionType = 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role' | 'number'

export interface OptionDef<T extends OptionType, R extends boolean> {
  type: T
  description: string
  required: R
  min?: number
  max?: number
  choices?: { name: string, value: string | number }[]
}

export type ResolveOptionType<T extends OptionType> = 
  T extends 'string' ? string :
  T extends 'integer' | 'number' ? number :
  T extends 'boolean' ? boolean :
  T extends 'user' ? User :
  T extends 'channel' ? Channel :
  T extends 'role' ? Role :
  never

export type ResolveOption<O extends OptionDef<OptionType, boolean>> =
  O['required'] extends true ? ResolveOptionType<O['type']> : ResolveOptionType<O['type']> | undefined

export type ResolveOptions<O extends Record<string, OptionDef<OptionType, boolean>>> = {
  [K in keyof O]: ResolveOption<O[K]>
}

export const opt = {
  string: <R extends boolean = false>(description: string, options?: { required?: R, choices?: {name: string, value: string}[], minLength?: number, maxLength?: number }): OptionDef<'string', R> => ({
    type: 'string',
    description,
    required: (options?.required ?? false) as R,
    ...options
  }),
  integer: <R extends boolean = false>(description: string, options?: { required?: R, choices?: {name: string, value: number}[], min?: number, max?: number }): OptionDef<'integer', R> => ({
    type: 'integer',
    description,
    required: (options?.required ?? false) as R,
    ...options
  }),
  number: <R extends boolean = false>(description: string, options?: { required?: R, choices?: {name: string, value: number}[], min?: number, max?: number }): OptionDef<'number', R> => ({
    type: 'number',
    description,
    required: (options?.required ?? false) as R,
    ...options
  }),
  boolean: <R extends boolean = false>(description: string, options?: { required?: R }): OptionDef<'boolean', R> => ({
    type: 'boolean',
    description,
    required: (options?.required ?? false) as R
  }),
  user: <R extends boolean = false>(description: string, options?: { required?: R }): OptionDef<'user', R> => ({
    type: 'user',
    description,
    required: (options?.required ?? false) as R
  }),
  channel: <R extends boolean = false>(description: string, options?: { required?: R }): OptionDef<'channel', R> => ({
    type: 'channel',
    description,
    required: (options?.required ?? false) as R
  }),
  role: <R extends boolean = false>(description: string, options?: { required?: R }): OptionDef<'role', R> => ({
    type: 'role',
    description,
    required: (options?.required ?? false) as R
  }),
}