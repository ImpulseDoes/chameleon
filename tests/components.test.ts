import { describe, it, expect } from 'vitest'
import {
  defineButton,
  defineStringSelect,
  defineUserSelect,
  defineRoleSelect,
  defineChannelSelect,
  defineMentionableSelect,
  defineModal,
  resolveButtonStyle,
  field
} from '../src/components/define.ts'
import { ActionRow } from '../src/components/actionRow.ts'
import { COMPONENT_TYPES, TEXT_INPUT_STYLES } from '../src/utils/constants.ts'

describe('defineButton', () => {

  it('should tag definition with type=button', () => {
    const btn = defineButton({
      customId: 'test-btn',
      label: 'Click me',
      style: 'primary',
      execute: async () => {}
    })

    expect(btn.type).toBe('button')
    expect(btn.customId).toBe('test-btn')
    expect(btn.label).toBe('Click me')
  })

  it('should support link-style button with url', () => {

    const btn = defineButton({
      url: 'https://example.com',
      label: 'Link',
      style: 'link'
    })

    expect(btn.url).toBe('https://example.com')
  })
})

describe('resolveButtonStyle', () => {

  it('should resolve string styles to numbers', () => {
    expect(resolveButtonStyle('primary')).toBe(1)
    expect(resolveButtonStyle('secondary')).toBe(2)
    expect(resolveButtonStyle('success')).toBe(3)
    expect(resolveButtonStyle('danger')).toBe(4)
    expect(resolveButtonStyle('link')).toBe(5)
    expect(resolveButtonStyle('premium')).toBe(6)
  })

  it('should pass through numeric styles', () => {
    expect(resolveButtonStyle(1)).toBe(1)
    expect(resolveButtonStyle(4)).toBe(4)
  })

  it('should default to 1 for unknown style', () => {
    expect(resolveButtonStyle('nonexistent')).toBe(1)
  })
})

describe('defineStringSelect', () => {

  it('should tag with type=string_select', () => {
    const sel = defineStringSelect({
      customId: 'reason-select',
      options: [
        { label: 'Spam', value: 'spam' },
        { label: 'Toxic', value: 'toxic' }
      ],
      execute: async () => {}
    })

    expect(sel.type).toBe('string_select')
    expect(sel.options).toHaveLength(2)
  })
})

describe('defineUserSelect', () => {

  it('should tag with type=user_select', () => {
    const sel = defineUserSelect({
      customId: 'target',
      execute: async () => {}
    })
    expect(sel.type).toBe('user_select')
  })
})

describe('defineRoleSelect', () => {

  it('should tag with type=role_select', () => {
    const sel = defineRoleSelect({
      customId: 'role',
      execute: async () => {}
    })
    expect(sel.type).toBe('role_select')
  })
})

describe('defineChannelSelect', () => {

  it('should tag with type=channel_select', () => {

    const sel = defineChannelSelect({
      customId: 'channel',
      channelTypes: [0, 2],
      execute: async () => {}
    })
    expect(sel.type).toBe('channel_select')
    expect(sel.channelTypes).toEqual([0, 2])
  })
})

describe('defineMentionableSelect', () => {

  it('should tag with type=mentionable_select', () => {

    const sel = defineMentionableSelect({
      customId: 'mentionable',
      execute: async () => {}
    })
    expect(sel.type).toBe('mentionable_select')
  })
})

describe('field helpers', () => {

  it('field.short should create SHORT text input', () => {

    const f = field.short('reason', 'Reason')

    expect(f.id).toBe('reason')
    expect(f.type).toBe(TEXT_INPUT_STYLES.SHORT)
    expect(f.label).toBe('Reason')
    expect(f.required).toBe(true)
  })

  it('field.paragraph should create PARAGRAPH text input', () => {

    const f = field.paragraph('details', 'Details', { required: false, placeholder: 'Write here...' })

    expect(f.type).toBe(TEXT_INPUT_STYLES.PARAGRAPH)
    expect(f.required).toBe(false)
    expect(f.placeholder).toBe('Write here...')
  })

  it('field.short should accept minLength/maxLength', () => {

    const f = field.short('name', 'Name', { minLength: 2, maxLength: 32 })

    expect(f.minLength).toBe(2)
    expect(f.maxLength).toBe(32)
  })
})

describe('defineModal', () => {

  it('should tag with type=modal and carry fields', () => {

    const modal = defineModal ({
      customId: 'report-form',
      title: 'Report',
      fields: [
        field.short('reason', 'Reason'),
        field.paragraph('details', 'Details', { required: false })
      ] as const,
      execute: async () => {}
    })

    expect(modal.type).toBe('modal')
    expect(modal.customId).toBe('report-form')
    expect(modal.title).toBe('Report')
    expect(modal.fields).toHaveLength(2)
  })
})

describe('ActionRow', () => {

  it('should wrap a button into an action row', () => {

    const btn = defineButton ({
      customId: 'confirm',
      label: 'OK',
      style: 'success',
      execute: async () => {}
    })

    const row = ActionRow.of(btn)

    expect(row.type).toBe(COMPONENT_TYPES.ACTION_ROW)
    expect(row.components).toHaveLength(1)
    expect(row.components[0].type).toBe(COMPONENT_TYPES.BUTTON)
    expect(row.components[0].label).toBe('OK')
    expect(row.components[0].style).toBe(3) // success
  })

  it('should wrap a string select into an action row', () => {

    const sel = defineStringSelect({
      customId: 'pick',
      options: [{ label: 'A', value: 'a' }],
      execute: async () => {}
    })

    const row = ActionRow.of(sel)
    expect(row.components[0].type).toBe(COMPONENT_TYPES.STRING_SELECT)
    expect(row.components[0].options).toHaveLength(1)
  })

  it('should wrap user/role/channel/mentionable selects', () => {

    const user = defineUserSelect({ customId: 'u', execute: async () => {} })
    const role = defineRoleSelect({ customId: 'r', execute: async () => {} })
    const channel = defineChannelSelect({ customId: 'ch', execute: async () => {} })
    const mentionable = defineMentionableSelect({ customId: 'm', execute: async () => {} })

    expect(ActionRow.of(user).components[0].type).toBe(COMPONENT_TYPES.USER_SELECT)
    expect(ActionRow.of(role).components[0].type).toBe(COMPONENT_TYPES.ROLE_SELECT)
    expect(ActionRow.of(channel).components[0].type).toBe(COMPONENT_TYPES.CHANNEL_SELECT)
    expect(ActionRow.of(mentionable).components[0].type).toBe(COMPONENT_TYPES.MENTIONABLE_SELECT)
  })

  it('should wrap text input fields', () => {

    const f = field.short('name', 'Your Name')
    const row = ActionRow.of(f)

    expect(row.components[0].type).toBe(COMPONENT_TYPES.TEXT_INPUT)
    expect(row.components[0].style).toBe(TEXT_INPUT_STYLES.SHORT)
    expect(row.components[0].label).toBe('Your Name')
  })

  it('should strip undefined keys from output', () => {

    const btn = defineButton({
      customId: 'x',
      label: 'X',
      style: 'primary',
      execute: async () => {}
    })

    const row = ActionRow.of(btn)
    const comp = row.components[0]

    expect(Object.keys(comp)).not.toContain('url')
    expect(Object.keys(comp)).not.toContain('emoji')
    expect(Object.keys(comp)).not.toContain('sku_id')
  })

  it('should pass through raw Discord API objects', () => {

    const raw = { type: 999, custom_id: 'raw' }
    const row = ActionRow.of(raw)

    expect(row.components[0].type).toBe(999)
  })

  it('should handle multiple buttons in one row', () => {

    const a = defineButton({ customId: 'a', label: 'A', style: 'primary', execute: async () => {} })
    const b = defineButton({ customId: 'b', label: 'B', style: 'danger', execute: async () => {} })
    const c = defineButton({ customId: 'c', label: 'C', style: 'secondary', execute: async () => {} })

    const row = ActionRow.of(a, b, c)
    
    expect(row.components).toHaveLength(3)
    expect(row.components[0].style).toBe(1) // primary
    expect(row.components[1].style).toBe(4) // danger
    expect(row.components[2].style).toBe(2) // secondary
  })
})