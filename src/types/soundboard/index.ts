import type { User } from '../user/index.js'
import type { AttachmentBuilder } from '../../builders/attachment.js'

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

export interface SoundboardCreateOptions {
  name: string
  sound: AttachmentBuilder | string
  volume?: number
  emojiId?: string
  emojiName?: string
}

export interface SoundboardEditOptions {
  name?: string
  volume?: number
  emojiId?: string | null
  emojiName?: string | null
}