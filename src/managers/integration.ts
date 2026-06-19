import type { ChameleonREST } from '../rest/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { Integration } from '../types/integration/index.js'
import { buildIntegration } from '../builders/index.js'

export class IntegrationManager {
  
  constructor(
    protected rest: ChameleonREST
  ) {}

  public async list(guildId: string): Promise<ChameleonAPIResult<Integration[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${guildId}/integrations`)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const integrations = (result.data as Record<string, unknown>[]).map(i => buildIntegration(i))

    return { ok: true, data: integrations }
  }

  public async delete(guildId: string, integrationId: string, reason?: string): Promise<ChameleonAPIResult<void>> {
    
    const headers = reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {}

    const result = await this.rest.delete(`/guilds/${guildId}/integrations/${integrationId}`, headers)

    return result as ChameleonAPIResult<void>
  }
}