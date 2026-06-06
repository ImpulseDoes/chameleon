import type { ChameleonREST } from '../rest/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { SoundboardSound, SoundboardCreateOptions, SoundboardEditOptions } from '../types/soundboard/index.js'
import { AttachmentBuilder } from '../builders/attachment.js'

export class SoundboardManager {

  constructor(protected rest: ChameleonREST) {}

  public async send(channelId: string, soundId: string, sourceGuildId?: string): Promise<ChameleonAPIResult<never>> {

    const payload: Record<string, unknown> = {
      sound_id: soundId
    }

    if (sourceGuildId !== undefined) payload.source_guild_id = sourceGuildId

    const result = await this.rest.post<never>(`/channels/${channelId}/send-soundboard-sound`, payload)

    return result
  }

  public async fetchDefault(): Promise<ChameleonAPIResult<SoundboardSound[]>> {

    const result = await this.rest.get<SoundboardSound[]>('/soundboard-default-sounds')

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: result.data }
  }

  public async fetch(guildId: string, soundId?: string): Promise<ChameleonAPIResult<SoundboardSound | SoundboardSound[]>> {

    if (soundId) {

      const result = await this.rest.get<SoundboardSound>(`/guilds/${guildId}/soundboard-sounds/${soundId}`)

      if (!result.ok) return result as ChameleonAPIResult<never>

      return { ok: true, data: result.data }

    } else {

      const result = await this.rest.get<{ items: SoundboardSound[] }>(`/guilds/${guildId}/soundboard-sounds`)

      if (!result.ok) return result as ChameleonAPIResult<never>

      return { ok: true, data: result.data.items }

    }
  }

  public async create(guildId: string, options: SoundboardCreateOptions, reason?: string): Promise<ChameleonAPIResult<SoundboardSound>> {

    let soundData = options.sound

    if (options.sound instanceof AttachmentBuilder) {
      soundData = `data:${options.sound.contentType ?? 'audio/ogg'};base64,${Buffer.from(options.sound.data).toString('base64')}`
    }

    const payload: Record<string, unknown> = {
      name: options.name,
      sound: soundData
    }

    if (options.volume !== undefined) payload.volume = options.volume
    if (options.emojiId !== undefined) payload.emoji_id = options.emojiId
    if (options.emojiName !== undefined) payload.emoji_name = options.emojiName

    const headers: Record<string, string> = {}
    if (reason) headers['X-Audit-Log-Reason'] = reason

    const result = await this.rest.post<SoundboardSound>(`/guilds/${guildId}/soundboard-sounds`, payload, headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: result.data }
  }

  public async edit(guildId: string, soundId: string, options: SoundboardEditOptions, reason?: string): Promise<ChameleonAPIResult<SoundboardSound>> {
    
    const payload: Record<string, unknown> = {}

    if (options.name !== undefined) payload.name = options.name
    if (options.volume !== undefined) payload.volume = options.volume
    if (options.emojiId !== undefined) payload.emoji_id = options.emojiId
    if (options.emojiName !== undefined) payload.emoji_name = options.emojiName

    const headers: Record<string, string> = {}
    if (reason) headers['X-Audit-Log-Reason'] = reason

    const result = await this.rest.patch<SoundboardSound>(`/guilds/${guildId}/soundboard-sounds/${soundId}`, payload, headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: result.data }
  }

  public async delete(guildId: string, soundId: string, reason?: string): Promise<ChameleonAPIResult<never>> {
    
    const headers: Record<string, string> = {}
    if (reason) headers['X-Audit-Log-Reason'] = reason

    const result = await this.rest.delete<never>(`/guilds/${guildId}/soundboard-sounds/${soundId}`, headers)

    return result
  }
}