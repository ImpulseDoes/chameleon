import type { ComponentContext } from './context.js'
import type { ModalContext } from '../commands/interactions.js'
import type { SelectOption } from '../types/components/index.js'
import type { Emoji } from '../types/expressions/index.js'
import type { User } from '../types/user/index.js'
import type { Role } from '../types/guild/index.js'
import type { Channel } from '../types/channel/index.js'
import { TEXT_INPUT_STYLES } from '../utils/constants.js'

export type ButtonStyleString = 'primary' | 'secondary' | 'success' | 'danger' | 'link' | 'premium'
export type EmojiResolvable = string | Partial<Emoji>

export interface ButtonDef {
  /** Custom ID returned in the interaction payload for non-link buttons */
  customId?: string
  /** External URL opened by a link button */
  url?: string
  /** Visible text rendered on the button */
  label?: string
  /** Discord button style as either a readable string or raw numeric value */
  style: ButtonStyleString | number
  /** Whether the button should be rendered as disabled */
  disabled?: boolean
  /** Optional emoji rendered next to the label */
  emoji?: Partial<Emoji>
  /** Premium SKU ID used by Discord premium buttons */
  skuId?: string
  /** Optional handler executed when the component interaction is received */
  execute?: (ctx: ComponentContext) => void | Promise<void>
}

/**
 * Normalize a human-readable button style into the numeric Discord API value
 * Accepts either a style name such as `'primary'` or a raw numeric style
 */
export function resolveButtonStyle(style: string | number): number {

  if (typeof style === 'number') return style
  
  const map: Record<string, number> = { primary: 1, secondary: 2, success: 3, danger: 4, link: 5, premium: 6 }
  
  return map[style] ?? 1
}

/**
 * Define a reusable button component handler
 * The returned object can be used in `ActionRow.of(...)` or in higher-level builders that accept button definitions
 *
 * @param def Button configuration including label, style, IDs and optional execute handler
 */
export function defineButton(def: ButtonDef): ButtonDef & { type: 'button' } {
  return { ...def, type: 'button' }
}

function resolveEmoji(emoji: EmojiResolvable): Partial<Emoji> {
  if (typeof emoji === 'string') return { name: emoji }
  return emoji
}

export const Button = {
  /** Build a reusable button definition that can be used in both V1 action rows and V2 accessories */
  of: (def: ButtonDef) => defineButton(def),
  /** @param customId Component custom ID sent back in the interaction payload @param label Visible button text @param emoji Optional emoji to show on the button */
  primary: (customId: string, label: string, emoji?: EmojiResolvable) => defineButton({ customId, label, style: 'primary', ...(emoji ? { emoji: resolveEmoji(emoji) } : {}) }),
  /** @param customId Component custom ID sent back in the interaction payload @param label Visible button text @param emoji Optional emoji to show on the button */
  secondary: (customId: string, label: string, emoji?: EmojiResolvable) => defineButton({ customId, label, style: 'secondary', ...(emoji ? { emoji: resolveEmoji(emoji) } : {}) }),
  /** @param customId Component custom ID sent back in the interaction payload @param label Visible button text @param emoji Optional emoji to show on the button */
  success: (customId: string, label: string, emoji?: EmojiResolvable) => defineButton({ customId, label, style: 'success', ...(emoji ? { emoji: resolveEmoji(emoji) } : {}) }),
  /** @param customId Component custom ID sent back in the interaction payload @param label Visible button text @param emoji Optional emoji to show on the button */
  danger: (customId: string, label: string, emoji?: EmojiResolvable) => defineButton({ customId, label, style: 'danger', ...(emoji ? { emoji: resolveEmoji(emoji) } : {}) }),
  /** @param url Destination URL opened by the button @param label Visible button text @param emoji Optional emoji to show on the button */
  link: (url: string, label: string, emoji?: EmojiResolvable) => defineButton({ url, label, style: 'link', ...(emoji ? { emoji: resolveEmoji(emoji) } : {}) }),
  /** @param skuId Premium SKU ID used by Discord premium buttons @param label Visible button text @param emoji Optional emoji to show on the button */
  premium: (skuId: string, label: string, emoji?: EmojiResolvable) => defineButton({ skuId, label, style: 'premium', ...(emoji ? { emoji: resolveEmoji(emoji) } : {}) }),
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

export type ModalFieldType = TEXT_INPUT_STYLES | 19 | 21 | 22 | 23

export interface ModalFieldDef<Required extends boolean = true, T extends ModalFieldType = ModalFieldType> {
  id: string
  type: T
  label?: string
  required?: Required
  minLength?: number
  maxLength?: number
  placeholder?: string
  value?: string | boolean | string[]
  options?: SelectOption[]
  [key: string]: unknown
}

export type AnyModalField = ModalFieldDef<boolean, ModalFieldType>

export const field = {

  /**
   * Create a single-line text input field for a modal
   * @param id Field ID used as the key inside `ctx.fields`
   * @param label Visible field label shown in the modal
   * @param options Extra validation and UX settings for the text input
   */
  short: <ID extends string, Req extends boolean = true>(id: ID, label: string, options?: { required?: Req, minLength?: number, maxLength?: number, placeholder?: string, value?: string }): ModalFieldDef<Req, TEXT_INPUT_STYLES.SHORT> & { id: ID } => ({
    id,
    type: TEXT_INPUT_STYLES.SHORT,
    label,
    required: options?.required ?? (true as Req),
    ...options
  }),
  
  /**
   * Create a multi-line text input field for a modal
   * @param id Field ID used as the key inside `ctx.fields`
   * @param label Visible field label shown in the modal
   * @param options Extra validation and UX settings for the paragraph input
   */
  paragraph: <ID extends string, Req extends boolean = true>(id: ID, label: string, options?: { required?: Req, minLength?: number, maxLength?: number, placeholder?: string, value?: string }): ModalFieldDef<Req, TEXT_INPUT_STYLES.PARAGRAPH> & { id: ID } => ({
    id,
    type: TEXT_INPUT_STYLES.PARAGRAPH,
    label,
    required: options?.required ?? (true as Req),
    ...options
  }),

  /**
   * Create a boolean checkbox field for a modal
   * @param id Field ID used as the key inside `ctx.fields`
   * @param label Visible field label shown in the modal
   * @param options Checkbox settings such as `required` and default `value`
   */
  checkbox: <ID extends string, Req extends boolean = true>(id: ID, label: string, options?: { required?: Req, value?: boolean }): ModalFieldDef<Req, 23> & { id: ID } => ({
    id,
    type: 23,
    label,
    required: options?.required ?? (true as Req),
    ...options
  }),

  /**
   * Create a multi-select checkbox group field for a modal
   * @param id Field ID used as the key inside `ctx.fields`
   * @param label Visible field label shown in the modal
   * @param options Available choices and selection limits
   */
  checkboxGroup: <ID extends string, Req extends boolean = true>(id: ID, label: string, options: { options: SelectOption[], required?: Req, minValues?: number, maxValues?: number }): ModalFieldDef<Req, 22> & { id: ID } => ({
    id,
    type: 22,
    label,
    required: options?.required ?? (true as Req),
    ...options
  }),

  /**
   * Create a single-choice radio group field for a modal
   * @param id Field ID used as the key inside `ctx.fields`
   * @param label Visible field label shown in the modal
   * @param options Available choices for the radio group
   */
  radioGroup: <ID extends string, Req extends boolean = true>(id: ID, label: string, options: { options: SelectOption[], required?: Req }): ModalFieldDef<Req, 21> & { id: ID } => ({
    id,
    type: 21,
    label,
    required: options?.required ?? (true as Req),
    ...options
  }),

  /**
   * Create a file upload field for a modal
   * Submitted files are available in `ctx.attachments[id]`
   * @param id Field ID used as the key inside `ctx.fields` and `ctx.attachments`
   * @param label Visible field label shown in the modal
   * @param options Upload field settings such as `required`
   */
  fileUpload: <ID extends string, Req extends boolean = true>(id: ID, label: string, options?: { required?: Req }): ModalFieldDef<Req, 19> & { id: ID } => ({
    id,
    type: 19,
    label,
    required: options?.required ?? (true as Req),
    ...options
  })
}

export type ResolveModalFieldType<K extends AnyModalField> = K['type'] extends 23 
  ? boolean 
  : K['type'] extends 19
    ? string[]
  : K['type'] extends 22 
    ? string[] 
    : string

export type ResolveModalFields<F extends ReadonlyArray<AnyModalField>> = {
  [K in F[number] as K['id']]: K['required'] extends false 
    ? ResolveModalFieldType<K> | undefined 
    : ResolveModalFieldType<K>
}

export interface ModalDef<F extends ReadonlyArray<AnyModalField>> {
  customId: string
  title: string
  fields: F
  execute: (ctx: ModalContext<ResolveModalFields<F>>) => void | Promise<void>
}

export function defineModal<F extends ReadonlyArray<AnyModalField>>(def: ModalDef<F>): ModalDef<F> & { type: 'modal' } {
  return { ...def, type: 'modal' }
}

export class ModalDefinitionBuilder<F extends ReadonlyArray<AnyModalField> = []> {
  constructor(
    private readonly customId: string,
    private readonly title: string,
    private readonly fieldsDef: F = [] as unknown as F
  ) {}

  /**
   * Append one or more fields to the modal definition
   * The resulting builder keeps full type information, so added field IDs become available in `ctx.fields`
   * @param fields Fields to add to the modal
   */
  add<NewFields extends ReadonlyArray<AnyModalField>>(...fields: NewFields) {
    return new ModalDefinitionBuilder<[...F, ...NewFields]>(
      this.customId,
      this.title,
      [...this.fieldsDef, ...fields] as [...F, ...NewFields]
    )
  }

  /**
   * Finalize the modal definition and attach its submit handler
   * The handler receives a strongly-typed `ctx.fields` object derived from the fields added to this builder
   * @param execute Modal submit handler
   */
  execute(execute: (ctx: ModalContext<ResolveModalFields<F>>) => void | Promise<void>) {
    return defineModal({
      customId: this.customId,
      title: this.title,
      fields: this.fieldsDef,
      execute
    })
  }

  handle(execute: (ctx: ModalContext<ResolveModalFields<F>>) => void | Promise<void>) {
    return this.execute(execute)
  }
}

/**
 * Start a fluent modal definition
 * @param customId Custom ID returned when the modal is submitted
 * @param title Modal title shown in the Discord client
 */
export function modal(customId: string, title: string) {
  return new ModalDefinitionBuilder(customId, title)
}