import type { User } from '../user/index.js'

export interface Emoji {
  id: string | null
  name: string | null
  roles?: string[]
  user?: User
  requireColons?: boolean
  managed?: boolean
  animated?: boolean
  available?: boolean
}

export const StickerType = {
  STANDARD: 1,
  GUILD: 2
} as const

export const StickerFormatType = {
  PNG: 1,
  APNG: 2,
  LOTTIE: 3,
  GIF: 4
} as const

export interface Sticker {
  id: string
  packId?: string
  name: string
  description: string | null
  tags: string
  type: number
  formatType: number
  available?: boolean
  guildId?: string
  user?: User
  sortValue?: number
}

export interface StickerItem {
  id: string
  name: string
  formatType: number
}

export interface StickerPack {
  id: string
  stickers: Sticker[]
  name: string
  skuId: string
  coverStickerId?: string
  description: string
  bannerAssetId?: string
}