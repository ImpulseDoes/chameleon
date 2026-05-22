export const SubscriptionStatus = {
  ACTIVE: 0,
  ENDING: 1,
  INACTIVE: 2
} as const

export interface Subscription {
  id: string
  userId: string
  skuIds: string[]
  entitlementIds: string[]
  renewalSkuIds: string[] | null
  currentPeriodStart: number // Unix ms
  currentPeriodEnd: number // Unix ms
  status: number
  canceledAt: number | null // Unix ms
  country?: string
}