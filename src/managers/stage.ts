import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildStageInstance } from '../builders/index.js'
import type { StageInstance } from '../types/stage/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class StageInstanceManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  private _cacheStage(raw: Record<string, unknown>): StageInstance {

    const stage = buildStageInstance(raw)
    
    this.store.stageInstances.set(stage.id, stage)
    return stage
  }

  private _findCachedByChannelId(channelId: string): StageInstance | undefined {
    return [...this.store.stageInstances.values()].find(stage => stage.channelId === channelId)
  }

  async fetch(channelId: string): Promise<ChameleonAPIResult<StageInstance>> {

    const cached = this._findCachedByChannelId(channelId)
    if (cached) return { ok: true, data: cached }

    const result = await this.rest.get<unknown>(`/stage-instances/${channelId}`)
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._cacheStage(result.data as Record<string, unknown>) }
  }

  async create(payload: Partial<StageInstance>, reason?: string): Promise<ChameleonAPIResult<StageInstance>> {

    const result = await this.rest.post<unknown>(`/stage-instances`, toSnakeCase(payload), createAuditLogHeaders(reason))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._cacheStage(result.data as Record<string, unknown>) }
  }

  async edit(channelId: string, payload: Partial<StageInstance>, reason?: string): Promise<ChameleonAPIResult<StageInstance>> {

    const result = await this.rest.patch<unknown>(`/stage-instances/${channelId}`, toSnakeCase(payload), createAuditLogHeaders(reason))
    if (!result.ok) return result as ChameleonAPIResult<never>
    
    return { ok: true, data: this._cacheStage(result.data as Record<string, unknown>) }
  }

  async delete(channelId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const result = await this.rest.delete(`/stage-instances/${channelId}`, createAuditLogHeaders(reason))
    
    if (result.ok) {
      const cached = this._findCachedByChannelId(channelId)
      if (cached) this.store.stageInstances.delete(cached.id)
    }
    
    return result as ChameleonAPIResult<void>
  }
}