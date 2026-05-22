export const StagePrivacyLevel = {
  PUBLIC: 1,
  GUILD_ONLY: 2
} as const

export interface StageInstance {
  id: string
  guildId: string
  channelId: string
  topic: string
  privacyLevel: number
  discoverableDisabled: boolean
  guildScheduledEventId: string | null
}