import { describe, it, expect } from 'vitest'
import {
  ButtonBuilder,
  SelectMenuBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalBuilder
} from '../src/builders/components.ts'
import { ComponentType, ButtonStyle } from '../src/types/components/index.ts'

describe('ButtonBuilder', () => {

  it('should build a basic button', () => {

    const btn = new ButtonBuilder()
      .setCustomId('btn')
      .setLabel('Click')
      .setStyle(1)
      .setDisabled(true)
      .setEmoji({ name: '👍' })

    const built = btn.build()
    
    expect(built.type).toBe(ComponentType.BUTTON)
    expect(built.customId).toBe('btn')
    expect(built.label).toBe('Click')
    expect(built.style).toBe(1)
    expect(built.disabled).toBe(true)
    expect(built.emoji).toEqual({ name: '👍' })
  })

  it('should set URL and style to link', () => {

    const btn = new ButtonBuilder().setURL('https://x.com')
    const json = btn.toJSON()

    expect(json.url).toBe('https://x.com')
    expect(json.style).toBe(ButtonStyle.LINK)
  })
})

describe('SelectMenuBuilder', () => {

  it('should build a select menu', () => {

    const sel = new SelectMenuBuilder()
      .setCustomId('sel')
      .setPlaceholder('Pick')
      .setMinValues(1)
      .setMaxValues(3)
      .setDisabled()
      .addOption({ label: 'A', value: 'a' })
      .addOptions({ label: 'B', value: 'b' }, { label: 'C', value: 'c' })
      .setType(ComponentType.STRING_SELECT)

    const json = sel.toJSON()

    expect(json.type).toBe(ComponentType.STRING_SELECT)
    expect(json.customId).toBe('sel')
    expect(json.placeholder).toBe('Pick')
    expect(json.minValues).toBe(1)
    expect(json.maxValues).toBe(3)
    expect(json.disabled).toBe(true)
    expect(json.options).toHaveLength(3)
  })
})

describe('TextInputBuilder', () => {

  it('should build a text input and map to API JSON format', () => {

    const input = new TextInputBuilder()
      .setCustomId('txt')
      .setLabel('Enter')
      .setStyle(1)
      .setPlaceholder('Type')
      .setMinLength(5)
      .setMaxLength(10)
      .setRequired(true)
      .setValue('Default')

    const built = input.build()

    expect(built.type).toBe(ComponentType.TEXT_INPUT)
    expect(built.customId).toBe('txt')
    expect(built.label).toBe('Enter')
    expect((built as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).minLength).toBe(5)
    expect((built as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).value).toBe('Default')

    const json = input.toJSON()

    expect(json.type).toBe(ComponentType.TEXT_INPUT)
    expect(json.custom_id).toBe('txt')
    expect(json.min_length).toBe(5)
    expect(json.max_length).toBe(10)
  })
})

describe('ActionRowBuilder', () => {

  it('should build an action row with components', () => {

    const btn = new ButtonBuilder().setCustomId('b1').setStyle(1)
    
    const row = new ActionRowBuilder()
      .addComponent(btn)
      .addComponents(new ButtonBuilder().setCustomId('b2').setStyle(2))

    const built = row.build()

    expect(built.type).toBe(ComponentType.ACTION_ROW)
    expect(built.components).toHaveLength(2)

    expect(built.components![0].customId).toBe('b1')

    expect(built.components![1].customId).toBe('b2')

    const json = row.toJSON()

    expect(json.type).toBe(ComponentType.ACTION_ROW)
  })
})

describe('ModalBuilder', () => {

  it('should build a modal with title, custom_id, and components', () => {

    const row = new ActionRowBuilder().addComponent(new TextInputBuilder().setCustomId('t1'))
    
    const modal = new ModalBuilder()
      .setTitle('Test Modal')
      .setCustomId('modal-1')
      .addComponent(row)

    const built = modal.build()

    expect(built.title).toBe('Test Modal')
    expect(built.custom_id).toBe('modal-1')
    expect(built.components).toHaveLength(1)

    const json = modal.toJSON()

    expect(json.title).toBe('Test Modal')
  })
})