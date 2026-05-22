import type { Member } from '../guild/index.js'

export interface Voice {
  guildId?: string
  channelId: string
  userId: string
  member?: Member
  sessionId: string
  deaf: boolean
  mute: boolean
  selfDeaf: boolean
  selfMute: boolean
  selfStream: boolean
  selfVideo: boolean
  suppress: boolean
  requestToSpeakTimestamp: number | null
}

type CHAMELEON_SELF_KEYS = Pick<Voice, "selfDeaf" | "selfMute" | "selfStream" | "selfVideo">

export const CHAMELEON_SELF_MAP = {
  selfMute:   "userMuted",
  selfDeaf:   "userDeafened",
  selfStream: "userStreaming",
  selfVideo:  "userVideo",
} as const satisfies Record<keyof CHAMELEON_SELF_KEYS, string>

export type ChameleonSelfKey = typeof CHAMELEON_SELF_MAP[keyof typeof CHAMELEON_SELF_MAP]