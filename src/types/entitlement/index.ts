export const EntitlementType = {
  PURCHASE: 1,
  PREMIUM_SUBSCRIPTION: 2,
  DEVELOPER_GIFT: 3,
  TEST_MODE_PURCHASE: 4,
  FREE_PURCHASE: 5,
  USER_GIFT: 6,
  PREMIUM_PURCHASE: 7,
  APPLICATION_SUBSCRIPTION: 8
} as const

export interface Entitlement {
  id: string
  skuId: string
  applicationId: string
  userId?: string
  type: number
  deleted: boolean
  startsAt?: number | null // Unix ms
  endsAt?: number | null // Unix ms
  guildId?: string
  consumed?: boolean
}