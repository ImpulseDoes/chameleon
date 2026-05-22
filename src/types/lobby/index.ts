import type { Channel } from '../channel/index.js'

export const LobbyMemberFlag = {
  CAN_LINK_LOBBY: 1 << 0
} as const

export interface LobbyMember {
  id: string
  metadata?: Record<string, string> | null
  flags?: number
}

export interface Lobby {
  id: string
  applicationId: string
  metadata: Record<string, string> | null
  members: LobbyMember[]
  linkedChannel?: Channel
}