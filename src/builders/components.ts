import type { MessageComponent, SelectOption } from '../types/components/index.js'
import type { Emoji } from '../types/expressions/index.js'
import { ComponentType, ButtonStyle } from '../types/components/index.js'

export class ButtonBuilder {

  private data: Partial<MessageComponent> = { type: ComponentType.BUTTON }

  setCustomId(id: string): this { this.data.customId = id; return this }
  setLabel(label: string): this { this.data.label = label; return this }
  setStyle(style: number): this { this.data.style = style; return this }
  setEmoji(emoji: Partial<Emoji>): this { this.data.emoji = emoji; return this }
  setDisabled(disabled = true): this { this.data.disabled = disabled; return this }
  setURL(url: string): this { this.data.url = url; this.data.style = ButtonStyle.LINK; return this }

  build(): MessageComponent { return { ...this.data } as MessageComponent }
  toJSON(): MessageComponent { return this.build() }
}

export class SelectMenuBuilder {

  private data: Partial<MessageComponent> = { type: ComponentType.STRING_SELECT }

  setCustomId(id: string): this { this.data.customId = id; return this }
  setPlaceholder(placeholder: string): this { this.data.placeholder = placeholder; return this }
  setMinValues(min: number): this { this.data.minValues = min; return this }
  setMaxValues(max: number): this { this.data.maxValues = max; return this }
  setDisabled(disabled = true): this { this.data.disabled = disabled; return this }

  addOption(option: SelectOption): this {

    if (!this.data.options) this.data.options = []
    this.data.options.push(option)
    
    return this
  }

  addOptions(...options: SelectOption[]): this {

    if (!this.data.options) this.data.options = []
    this.data.options.push(...options)
    
    return this
  }

  setType(type: number): this { this.data.type = type; return this }

  build(): MessageComponent { return { ...this.data } as MessageComponent }
  toJSON(): MessageComponent { return this.build() }
}

export class TextInputBuilder {

  private data: Partial<MessageComponent> = { type: ComponentType.TEXT_INPUT }

  setCustomId(id: string): this { this.data.customId = id; return this }
  setLabel(label: string): this { this.data.label = label; return this }
  setStyle(style: number): this { this.data.style = style; return this }
  setPlaceholder(placeholder: string): this { this.data.placeholder = placeholder; return this }
  setMinLength(min: number): this { (this.data as any).min_length = min; return this }
  setMaxLength(max: number): this { (this.data as any).max_length = max; return this }
  setRequired(required = true): this { (this.data as any).required = required; return this }
  setValue(value: string): this { (this.data as any).value = value; return this }

  build(): MessageComponent { return { ...this.data } as MessageComponent }
  toJSON(): MessageComponent { return this.build() }
}

export class ActionRowBuilder {

  private data: MessageComponent = { type: ComponentType.ACTION_ROW, components: [] }

  addComponent(component: MessageComponent | { build(): MessageComponent }): this {
    
    const built = 'build' in component && typeof component.build === 'function'
      ? component.build()
      : component as MessageComponent

    this.data.components!.push(built)

    return this
  }

  addComponents(...components: (MessageComponent | { build(): MessageComponent })[]): this {

    for (const c of components) this.addComponent(c)
    
      return this
  }

  build(): MessageComponent { return { ...this.data, components: [...this.data.components!] } }
  toJSON(): MessageComponent { return this.build() }
}

export class ModalBuilder {

  private _title = ''
  private _customId = ''
  private _components: MessageComponent[] = []

  setTitle(title: string): this { this._title = title; return this }
  setCustomId(id: string): this { this._customId = id; return this }

  addComponent(row: MessageComponent | { build(): MessageComponent }): this {
    const built = 'build' in row && typeof row.build === 'function'
      ? row.build()
      : row as MessageComponent
    this._components.push(built)
    return this
  }

  addComponents(...rows: (MessageComponent | { build(): MessageComponent })[]): this {
    for (const r of rows) this.addComponent(r)
    return this
  }

  build() {
    return {
      title: this._title,
      custom_id: this._customId,
      components: [...this._components]
    }
  }

  toJSON() { return this.build() }
}