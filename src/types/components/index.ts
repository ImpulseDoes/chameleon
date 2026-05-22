import type { Emoji } from '../expressions/index.js'

export const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  STRING_SELECT: 3,
  TEXT_INPUT: 4,
  USER_SELECT: 5,
  ROLE_SELECT: 6,
  MENTIONABLE_SELECT: 7,
  CHANNEL_SELECT: 8
} as const

export const ButtonStyle = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
  LINK: 5,
  PREMIUM: 6
} as const

export interface SelectOption {
  label: string
  value: string
  description?: string
  emoji?: Partial<Emoji>
  default?: boolean
}

export interface MessageComponent {
  type: number
  customId?: string
  disabled?: boolean
  style?: number
  label?: string
  emoji?: Partial<Emoji>
  url?: string
  options?: SelectOption[]
  placeholder?: string
  minValues?: number
  maxValues?: number
  components?: MessageComponent[]
  skuId?: string
  channelTypes?: number[]
}