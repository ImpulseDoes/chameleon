export const AutoModerationEventType = {
  MESSAGE_SEND: 1,
  MEMBER_UPDATE: 2
} as const

export const AutoModerationTriggerType = {
  KEYWORD: 1,
  SPAM: 3,
  KEYWORD_PRESET: 4,
  MENTION_SPAM: 5,
  MEMBER_PROFILE: 6
} as const

export const AutoModerationKeywordPresetType = {
  PROFANITY: 1,
  SEXUAL_CONTENT: 2,
  SLURS: 3
} as const

export const AutoModerationActionType = {
  BLOCK_MESSAGE: 1,
  SEND_ALERT_MESSAGE: 2,
  TIMEOUT: 3,
  BLOCK_MEMBER_INTERACTION: 4
} as const

export interface AutoModerationTriggerMetadata {
  keywordFilter?: string[]
  regexPatterns?: string[]
  presets?: number[]
  allowList?: string[]
  mentionTotalLimit?: number
  mentionRaidProtectionEnabled?: boolean
}

export interface AutoModerationActionMetadata {
  channelId?: string
  durationSeconds?: number
  customMessage?: string
}

export interface AutoModerationAction {
  type: number
  metadata?: AutoModerationActionMetadata
}

export interface AutoModerationRule {
  id: string
  guildId: string
  name: string
  creatorId: string
  eventType: number
  triggerType: number
  triggerMetadata: AutoModerationTriggerMetadata
  actions: AutoModerationAction[]
  enabled: boolean
  exemptRoles: string[]
  exemptChannels: string[]
}