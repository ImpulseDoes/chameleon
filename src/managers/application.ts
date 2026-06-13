import type { ChameleonREST } from '../rest/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { Application, ApplicationRoleConnectionMetadata } from '../types/application/index.js'
import type { Client } from '../client/client.js'

export class ApplicationManager {
  
  constructor(
    protected rest: ChameleonREST,
    protected _client: Client
  ) {}

  public async fetch(): Promise<ChameleonAPIResult<Application>> {
    
    const result = await this.rest.get<Application>('/oauth2/applications/@me')

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: result.data }
  }

  public async fetchRoleConnectionMetadata(): Promise<ChameleonAPIResult<ApplicationRoleConnectionMetadata[]>> {
    
    if (!this._client.user?.id) {
      return { ok: false, status: 400, error: 'Client not ready', message: 'Client not ready' } as ChameleonAPIResult<never>
    }

    const result = await this.rest.get<ApplicationRoleConnectionMetadata[]>(`/applications/${this._client.user.id}/role-connections/metadata`)

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: result.data }
  }

  public async editRoleConnectionMetadata(records: ApplicationRoleConnectionMetadata[]): Promise<ChameleonAPIResult<ApplicationRoleConnectionMetadata[]>> {

    if (!this._client.user?.id) {
      return { ok: false, status: 400, error: 'Client not ready', message: 'Client not ready' } as ChameleonAPIResult<never>
    }

    const result = await this.rest.put<ApplicationRoleConnectionMetadata[]>(`/applications/${this._client.user.id}/role-connections/metadata`, records)

    if (!result.ok) return result as ChameleonAPIResult<never>

    return { ok: true, data: result.data }
  }
}