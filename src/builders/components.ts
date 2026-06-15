import type { MessageComponent, SelectOption } from '../types/components/index.js'
import type { Emoji } from '../types/expressions/index.js'
import {
  ComponentType,
  ButtonStyle,
} from '../types/components/index.js'
import { toCamelCase, toSnakeCase } from '../utils/object.js'
import { resolveButtonStyle, type ButtonDef, type StringSelectDef, type UserSelectDef, type RoleSelectDef, type MentionableSelectDef, type ChannelSelectDef } from '../components/define.js'

type ComponentDefinition =
  | (ButtonDef & { type: 'button' })
  | (StringSelectDef & { type: 'string_select' })
  | (UserSelectDef & { type: 'user_select' })
  | (RoleSelectDef & { type: 'role_select' })
  | (MentionableSelectDef & { type: 'mentionable_select' })
  | (ChannelSelectDef & { type: 'channel_select' })

function serializeEmoji(emoji?: Partial<Emoji>) {

  if (!emoji) return undefined

  return {
    id: emoji.id,
    name: emoji.name,
    animated: emoji.animated,
  }
}

export class ButtonBuilder {

  private data: Partial<MessageComponent> = {
    type: ComponentType.BUTTON,
  }

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  setLabel(label: string): this {
    this.data.label = label
    return this
  }

  setStyle(style: number): this {
    this.data.style = style
    return this
  }

  setEmoji(emoji: Partial<Emoji>): this {
    this.data.emoji = emoji
    return this
  }

  setDisabled(disabled = true): this {
    this.data.disabled = disabled
    return this
  }

  setURL(url: string): this {
    this.data.url = url
    this.data.style = ButtonStyle.LINK
    return this
  }

  build(): MessageComponent {
    return {
      ...this.data,
    } as MessageComponent
  }

  toJSON(): Record<string, unknown> {
    return {
      type: ComponentType.BUTTON,
      custom_id: this.data.customId,
      label: this.data.label,
      style: this.data.style,
      disabled: this.data.disabled,
      url: this.data.url,
      emoji: serializeEmoji(this.data.emoji),
    }
  }
}

export class SelectMenuBuilder {

  private data: Partial<MessageComponent> = {
    type: ComponentType.STRING_SELECT,
  }

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder
    return this
  }

  setMinValues(min: number): this {
    this.data.minValues = min
    return this
  }

  setMaxValues(max: number): this {
    this.data.maxValues = max
    return this
  }

  setDisabled(disabled = true): this {
    this.data.disabled = disabled
    return this
  }

  setType(type: number): this {
    this.data.type = type
    return this
  }

  addOption(option: SelectOption): this {

    if (!this.data.options) {
      this.data.options = []
    }

    this.data.options.push(option)

    return this
  }

  addOptions(...options: SelectOption[]): this {

    if (!this.data.options) {
      this.data.options = []
    }

    this.data.options.push(...options)

    return this
  }

  build(): MessageComponent {
    return {
      ...this.data,
    } as MessageComponent
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.data.type ?? ComponentType.STRING_SELECT,
      custom_id: this.data.customId,
      placeholder: this.data.placeholder,
      min_values: this.data.minValues,
      max_values: this.data.maxValues,
      disabled: this.data.disabled,

      options: this.data.options?.map(option => ({
        label: option.label,
        value: option.value,
        description: option.description,
        emoji: serializeEmoji(option.emoji),
        default: option.default,
      })),
    }
  }
}

export class TextInputBuilder {

  private data: Partial<MessageComponent> = {
    type: ComponentType.TEXT_INPUT,
  }

  private _minLength?: number
  private _maxLength?: number
  private _required?: boolean
  private _value?: string

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  setLabel(label: string): this {
    this.data.label = label
    return this
  }

  setStyle(style: number): this {
    this.data.style = style
    return this
  }

  setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder
    return this
  }

  setMinLength(length: number): this {
    this._minLength = length
    return this
  }

  setMaxLength(length: number): this {
    this._maxLength = length
    return this
  }

  setRequired(required = true): this {
    this._required = required
    return this
  }

  setValue(value: string): this {
    this._value = value
    return this
  }

  build(): MessageComponent {
    return {
      ...this.data,
      minLength: this._minLength,
      maxLength: this._maxLength,
      required: this._required,
      value: this._value,
    } as MessageComponent
  }

  toJSON(): Record<string, unknown> {
    return {
      type: ComponentType.TEXT_INPUT,
      custom_id: this.data.customId,
      style: this.data.style,
      label: this.data.label,
      placeholder: this.data.placeholder,
      min_length: this._minLength,
      max_length: this._maxLength,
      required: this._required,
      value: this._value,
    }
  }
}

export class ActionRowBuilder {

  private data: MessageComponent = {
    type: ComponentType.ACTION_ROW,
    components: [],
  }

  addComponent(
    component:
      | MessageComponent
      | { build(): MessageComponent }
      | { toJSON(): Record<string, unknown> }
      | ComponentDefinition,
  ): this {

    this.data.components!.push(component as MessageComponent)

    return this
  }

  addComponents(
    ...components: (
      | MessageComponent
      | { build(): MessageComponent }
      | { toJSON(): Record<string, unknown> }
      | ComponentDefinition
    )[]
  ): this {

    for (const component of components) {
      this.addComponent(component)
    }

    return this
  }

  build(): MessageComponent {
    return {
      ...this.data,
      components: this.data.components!.map(component => toCamelCase(serializeComponent(component)) as MessageComponent),
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      type: ComponentType.ACTION_ROW,
      components: this.data.components?.map(component => serializeComponent(component)),
    }
  }
}

export class ModalBuilder {

  private _title = ''
  private _customId = ''
  private _components: (MessageComponent | { build(): MessageComponent } | { toJSON(): Record<string, unknown> })[] = []

  setTitle(title: string): this {
    this._title = title
    return this
  }

  setCustomId(id: string): this {
    this._customId = id
    return this
  }

  addComponent(
    component:
      | MessageComponent
      | { build(): MessageComponent }
      | { toJSON(): Record<string, unknown> },
  ): this {

    this._components.push(component)

    return this
  }

  addComponents(...components: (MessageComponent | { build(): MessageComponent } | { toJSON(): Record<string, unknown> })[]) {

    for (const component of components) {
      this.addComponent(component)
    }

    return this
  }

  build() {
    return {
      title: this._title,
      custom_id: this._customId,
      components: this._components.map(component => {
        if (
          component &&
          typeof (component as unknown as { build(): MessageComponent }).build === 'function'
        ) {
          return (component as unknown as { build(): MessageComponent }).build()
        }
        return component
      }),
    }
  }

  toJSON() {
    return {
      title: this._title,
      custom_id: this._customId,

      components: this._components.map(component => {

        if (
          component &&
          typeof (component as { toJSON?(): Record<string, unknown> }).toJSON === 'function'
        ) {
          return (component as { toJSON(): Record<string, unknown> }).toJSON()
        }

        return component
      }),
    }
  }
}

export function serializeComponent(component: MessageComponent | { build?(): MessageComponent } | { toJSON?(): Record<string, unknown> } | Record<string, unknown>): Record<string, unknown> {
  
  if (!component) return {}
  
  if (typeof component === 'object') {

    const definition = component as Partial<ComponentDefinition>

    if (definition.type === 'button') {
      return Object.fromEntries(Object.entries({
        type: ComponentType.BUTTON,
        custom_id: definition.customId,
        label: definition.label,
        style: resolveButtonStyle(definition.style as string | number),
        disabled: definition.disabled,
        url: definition.url,
        emoji: serializeEmoji(definition.emoji),
        sku_id: definition.skuId,
      }).filter(([, value]) => value !== undefined))
    }

    if (definition.type === 'string_select') {
      return Object.fromEntries(Object.entries({
        type: ComponentType.STRING_SELECT,
        custom_id: definition.customId,
        options: definition.options,
        placeholder: definition.placeholder,
        min_values: definition.minValues,
        max_values: definition.maxValues,
        disabled: definition.disabled,
      }).filter(([, value]) => value !== undefined))
    }

    if (definition.type === 'user_select' || definition.type === 'role_select' || definition.type === 'mentionable_select') {
      
      const typeMap: Record<'user_select' | 'role_select' | 'mentionable_select', number> = {
        user_select: ComponentType.USER_SELECT,
        role_select: ComponentType.ROLE_SELECT,
        mentionable_select: ComponentType.MENTIONABLE_SELECT,
      }

      return Object.fromEntries(Object.entries({
        type: typeMap[definition.type],
        custom_id: definition.customId,
        placeholder: definition.placeholder,
        min_values: definition.minValues,
        max_values: definition.maxValues,
        disabled: definition.disabled,
      }).filter(([, value]) => value !== undefined))
    }

    if (definition.type === 'channel_select') {
      return Object.fromEntries(Object.entries({
        type: ComponentType.CHANNEL_SELECT,
        custom_id: definition.customId,
        placeholder: definition.placeholder,
        min_values: definition.minValues,
        max_values: definition.maxValues,
        disabled: definition.disabled,
        channel_types: definition.channelTypes,
      }).filter(([, value]) => value !== undefined))
    }
  }
  
  if (typeof (component as { toJSON?(): Record<string, unknown> }).toJSON === 'function') {
    return (component as { toJSON(): Record<string, unknown> }).toJSON()
  }
  
  if (typeof (component as { build?(): MessageComponent }).build === 'function') {
    return toSnakeCase((component as { build(): MessageComponent }).build()) as Record<string, unknown>
  }
  
  return toSnakeCase(component) as Record<string, unknown>
}