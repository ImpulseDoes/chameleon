import { resolveButtonStyle } from './define.js'
import type { ButtonDef, StringSelectDef, UserSelectDef, RoleSelectDef, MentionableSelectDef, ChannelSelectDef, ModalFieldDef } from './define.js'
import { COMPONENT_TYPES, TEXT_INPUT_STYLES } from '../utils/constants.js'

type ComponentInput = 
  | (ButtonDef & { type: 'button' })
  | (StringSelectDef & { type: 'string_select' })
  | (UserSelectDef & { type: 'user_select' })
  | (RoleSelectDef & { type: 'role_select' })
  | (MentionableSelectDef & { type: 'mentionable_select' })
  | (ChannelSelectDef & { type: 'channel_select' })
  | (ModalFieldDef & { id: string })
  | Record<string, unknown>

export const ActionRow = {

  of: (...components: ComponentInput[]) => {

    return {
      type: COMPONENT_TYPES.ACTION_ROW,
      components: components.map(c => {
        if ('type' in c && c.type === 'button') {
          const btn = c as ButtonDef & { type: 'button' }
          return {
            type: COMPONENT_TYPES.BUTTON,
            custom_id: btn.customId,
            url: btn.url,
            label: btn.label,
            style: resolveButtonStyle(btn.style),
            disabled: btn.disabled,
            emoji: btn.emoji,
            sku_id: btn.skuId
          }
        }

        if ('type' in c && c.type === 'string_select') {
          const sel = c as StringSelectDef & { type: 'string_select' }
          return {
            type: COMPONENT_TYPES.STRING_SELECT,
            custom_id: sel.customId,
            options: sel.options,
            placeholder: sel.placeholder,
            min_values: sel.minValues,
            max_values: sel.maxValues,
            disabled: sel.disabled
          }
        }

        if ('type' in c && c.type === 'user_select') {
          const sel = c as UserSelectDef & { type: 'user_select' }
          return { type: COMPONENT_TYPES.USER_SELECT, custom_id: sel.customId, placeholder: sel.placeholder, min_values: sel.minValues, max_values: sel.maxValues, disabled: sel.disabled }
        }

        if ('type' in c && c.type === 'role_select') {
          const sel = c as RoleSelectDef & { type: 'role_select' }
          return { type: COMPONENT_TYPES.ROLE_SELECT, custom_id: sel.customId, placeholder: sel.placeholder, min_values: sel.minValues, max_values: sel.maxValues, disabled: sel.disabled }
        }

        if ('type' in c && c.type === 'mentionable_select') {
          const sel = c as MentionableSelectDef & { type: 'mentionable_select' }
          return { type: COMPONENT_TYPES.MENTIONABLE_SELECT, custom_id: sel.customId, placeholder: sel.placeholder, min_values: sel.minValues, max_values: sel.maxValues, disabled: sel.disabled }
        }
        
        if ('type' in c && c.type === 'channel_select') {
          const sel = c as ChannelSelectDef & { type: 'channel_select' }
          return { type: COMPONENT_TYPES.CHANNEL_SELECT, custom_id: sel.customId, channel_types: sel.channelTypes, placeholder: sel.placeholder, min_values: sel.minValues, max_values: sel.maxValues, disabled: sel.disabled }
        }

        if ('type' in c && (c.type === TEXT_INPUT_STYLES.SHORT || c.type === TEXT_INPUT_STYLES.PARAGRAPH)) {
          const field = c as ModalFieldDef & { id: string }
          return {
            type: COMPONENT_TYPES.TEXT_INPUT,
            custom_id: field.id,
            style: field.type,
            label: field.label,
            required: field.required,
            min_length: field.minLength,
            max_length: field.maxLength,
            placeholder: field.placeholder,
            value: field.value
          }
        }
        
        return c // fallback for raw discord API objects
      }).map(obj => {

        const clean: Record<string, unknown> = {} // remove undefined keys for cleaner JSON
        
        for (const [k, v] of Object.entries(obj)) {
          if (v !== undefined) clean[k] = v
        }

        return clean
      })
    }
  }
}