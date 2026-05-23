import { resolveButtonStyle } from './define.js'
import { COMPONENT_TYPES, TEXT_INPUT_STYLES } from '../utils/constants.js'

export const ActionRow = {
  of: (...components: any[]) => {

    return {
      type: COMPONENT_TYPES.ACTION_ROW,
      components: components.map(c => {
        if (c.type === 'button') {
          return {
            type: COMPONENT_TYPES.BUTTON,
            custom_id: c.customId,
            url: c.url,
            label: c.label,
            style: resolveButtonStyle(c.style),
            disabled: c.disabled,
            emoji: c.emoji,
            sku_id: c.skuId
          }
        }

        if (c.type === 'string_select') {
          return {
            type: COMPONENT_TYPES.STRING_SELECT,
            custom_id: c.customId,
            options: c.options,
            placeholder: c.placeholder,
            min_values: c.minValues,
            max_values: c.maxValues,
            disabled: c.disabled
          }
        }

        if (c.type === 'user_select') {
          return { type: COMPONENT_TYPES.USER_SELECT, custom_id: c.customId, placeholder: c.placeholder, min_values: c.minValues, max_values: c.maxValues, disabled: c.disabled }
        }

        if (c.type === 'role_select') {
          return { type: COMPONENT_TYPES.ROLE_SELECT, custom_id: c.customId, placeholder: c.placeholder, min_values: c.minValues, max_values: c.maxValues, disabled: c.disabled }
        }

        if (c.type === 'mentionable_select') {
          return { type: COMPONENT_TYPES.MENTIONABLE_SELECT, custom_id: c.customId, placeholder: c.placeholder, min_values: c.minValues, max_values: c.maxValues, disabled: c.disabled }
        }
        
        if (c.type === 'channel_select') {
          return { type: COMPONENT_TYPES.CHANNEL_SELECT, custom_id: c.customId, channel_types: c.channelTypes, placeholder: c.placeholder, min_values: c.minValues, max_values: c.maxValues, disabled: c.disabled }
        }

        if (c.type === TEXT_INPUT_STYLES.SHORT || c.type === TEXT_INPUT_STYLES.PARAGRAPH) {
          return {
            type: COMPONENT_TYPES.TEXT_INPUT,
            custom_id: c.id,
            style: c.type,
            label: c.label,
            required: c.required,
            min_length: c.minLength,
            max_length: c.maxLength,
            placeholder: c.placeholder,
            value: c.value
          }
        }
        
        return c // fallback for raw discord API objects
      }).map(obj => {

        const clean: any = {} // remove undefined keys for cleaner JSON
        
        for (const [k, v] of Object.entries(obj)) {
          if (v !== undefined) clean[k] = v
        }

        return clean
      })
    }
  }
}