import type { ChameleonREST } from '../rest/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { VoiceRegion } from '../types/voice/index.js'
import { toSnakeCase } from '../utils/object.js'

export class VoiceManager {
  
  constructor(
    protected rest: ChameleonREST
  ) {}

  public async listRegions(): Promise<ChameleonAPIResult<VoiceRegion[]>> {

    const result = await this.rest.get<unknown[]>('/voice/regions')

    if (!result.ok) return result as ChameleonAPIResult<never>

    const regions = (result.data as Record<string, unknown>[]).map(r => ({
      id: r.id as string,
      name: r.name as string,
      optimal: r.optimal as boolean,
      deprecated: r.deprecated as boolean,
      custom: r.custom as boolean
    }))

    return { ok: true, data: regions }
  }

  public async updateCurrentUserVoiceState(guildId: string, options: { channelId: string, suppress?: boolean, requestToSpeakTimestamp?: string | null }): Promise<ChameleonAPIResult<void>> {
    
    const result = await this.rest.patch(`/guilds/${guildId}/voice-states/@me`, toSnakeCase(options))

    return result as ChameleonAPIResult<void>
  }

  public async updateUserVoiceState(guildId: string, userId: string, options: { channelId: string, suppress?: boolean }): Promise<ChameleonAPIResult<void>> {
    
    const result = await this.rest.patch(`/guilds/${guildId}/voice-states/${userId}`, toSnakeCase(options))

    return result as ChameleonAPIResult<void>
  }
}