import type { User } from '../user/index.js'

export interface SoundboardSound {
  name: string
  soundId: string
  volume: number
  emojiId: string | null
  emojiName: string | null
  guildId?: string
  available: boolean
  user?: User
}