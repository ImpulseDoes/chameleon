export const SkuType = {
  DURABLE: 2,
  CONSUMABLE: 3,
  SUBSCRIPTION: 5,
  SUBSCRIPTION_GROUP: 6
} as const

export const SkuFlag = {
  AVAILABLE: 1 << 2,
  GUILD_SUBSCRIPTION: 1 << 7,
  USER_SUBSCRIPTION: 1 << 8
} as const

export interface Sku {
  id: string
  type: number
  applicationId: string
  name: string
  slug: string
  flags: number
}