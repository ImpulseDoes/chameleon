import type { ComponentContext } from './context.js'
import type { SelectOption } from '../types/components/index.js'
import type { Emoji } from '../types/expressions/index.js'
import type { User } from '../types/user/index.js'
import type { Role } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import { TEXT_INPUT_STYLES } from '../utils/constants.js'

export type ButtonStyleString = 'primary' | 'secondary' | 'success' | 'danger' | 'link' | 'premium'

export interface ButtonDef {
  customId?: string
  url?: string
  label?: string
  style: ButtonStyleString | number
  disabled?: boolean
  emoji?: Partial<Emoji>
  skuId?: string
  execute?: (ctx: ComponentContext) => void | Promise<void>
}

export function resolveButtonStyle(style: string | number): number {

  if (typeof style === 'number') return style
  
  const map: Record<string, number> = { primary: 1, secondary: 2, success: 3, danger: 4, link: 5, premium: 6 }
  
  return map[style] ?? 1
}

export function defineButton(def: ButtonDef): ButtonDef & { type: 'button' } {
  return { ...def, type: 'button' }
}

export interface StringSelectDef {
  customId: string
  options: SelectOption[]
  placeholder?: string
  minValues?: number
  maxValues?: number
  disabled?: boolean
  execute: (ctx: ComponentContext<string[]>) => void | Promise<void>
}

export function defineStringSelect(def: StringSelectDef): StringSelectDef & { type: 'string_select' } {
  return { ...def, type: 'string_select' }
}

export interface UserSelectDef {
  customId: string
  placeholder?: string
  minValues?: number
  maxValues?: number
  disabled?: boolean
  execute: (ctx: ComponentContext<User[]>) => void | Promise<void>
}

export function defineUserSelect(def: UserSelectDef): UserSelectDef & { type: 'user_select' } {
  return { ...def, type: 'user_select' }
}

export interface RoleSelectDef {
  customId: string
  placeholder?: string
  minValues?: number
  maxValues?: number
  disabled?: boolean
  execute: (ctx: ComponentContext<Role[]>) => void | Promise<void>
}

export function defineRoleSelect(def: RoleSelectDef): RoleSelectDef & { type: 'role_select' } {
  return { ...def, type: 'role_select' }
}

export interface ChannelSelectDef {
  customId: string
  channelTypes?: number[]
  placeholder?: string
  minValues?: number
  maxValues?: number
  disabled?: boolean
  execute: (ctx: ComponentContext<Partial<Channel>[]>) => void | Promise<void>
}

export function defineChannelSelect(def: ChannelSelectDef): ChannelSelectDef & { type: 'channel_select' } {
  return { ...def, type: 'channel_select' }
}

export interface MentionableSelectDef {
  customId: string
  placeholder?: string
  minValues?: number
  maxValues?: number
  disabled?: boolean
  execute: (ctx: ComponentContext<(User | Role)[]>) => void | Promise<void>
}

export function defineMentionableSelect(def: MentionableSelectDef): MentionableSelectDef & { type: 'mentionable_select' } {
  return { ...def, type: 'mentionable_select' }
}

export interface ModalFieldDef<Required extends boolean = true> {
  id: string
  type: TEXT_INPUT_STYLES
  label: string
  required?: Required
  minLength?: number
  maxLength?: number
  placeholder?: string
  value?: string
}

export const field = {
  short: <ID extends string, Req extends boolean = true>(id: ID, label: string, options?: { required?: Req, minLength?: number, maxLength?: number, placeholder?: string, value?: string }): ModalFieldDef<Req> & { id: ID } => ({
    id,
    type: TEXT_INPUT_STYLES.SHORT,
    label,
    required: options?.required ?? (true as Req),
    ...options
  }),
  paragraph: <ID extends string, Req extends boolean = true>(id: ID, label: string, options?: { required?: Req, minLength?: number, maxLength?: number, placeholder?: string, value?: string }): ModalFieldDef<Req> & { id: ID } => ({
    id,
    type: TEXT_INPUT_STYLES.PARAGRAPH,
    label,
    required: options?.required ?? (true as Req),
    ...options
  })
}

export type ResolveModalFields<F extends ReadonlyArray<ModalFieldDef<any>>> = {
  [K in F[number] as K['id']]: K['required'] extends false ? string | undefined : string
}

export interface ModalDef<F extends ReadonlyArray<ModalFieldDef<any>>> {
  customId: string
  title: string
  fields: F
  execute: (ctx: ComponentContext<never, ResolveModalFields<F>>) => void | Promise<void>
}

export function defineModal<F extends ReadonlyArray<ModalFieldDef<any>>>(def: ModalDef<F>): ModalDef<F> & { type: 'modal' } {
  return { ...def, type: 'modal' }
}