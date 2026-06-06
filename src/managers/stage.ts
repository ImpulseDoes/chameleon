import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import { buildStageInstance } from '../builders/index.js'
import type { StageInstance } from '../types/stage/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toSnakeCase } from '../utils/object.js'

export class StageInstanceManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  async fetch(channelId: string): Promise<ChameleonAPIResult<StageInstance>> {

    const cached = Array.from(this.store.stageInstances.values()).find(s => s.channelId === channelId)
    if (cached) return { ok: true, data: cached }

    const result = await this.rest.get<unknown>(`/stage-instances/${channelId}`)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const stage = buildStageInstance(result.data as Record<string, unknown>)
    this.store.stageInstances.set(stage.id, stage)
    
    return { ok: true, data: stage }
  }

  async create(payload: Partial<StageInstance>, reason?: string): Promise<ChameleonAPIResult<StageInstance>> {

    const headers: Record<string, string> = {}
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.post<unknown>(`/stage-instances`, toSnakeCase(payload), headers)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const stage = buildStageInstance(result.data as Record<string, unknown>)
    this.store.stageInstances.set(stage.id, stage)
    
    return { ok: true, data: stage }
  }

  async edit(channelId: string, payload: Partial<StageInstance>, reason?: string): Promise<ChameleonAPIResult<StageInstance>> {

    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.patch<unknown>(`/stage-instances/${channelId}`, toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const stage = buildStageInstance(result.data as Record<string, unknown>)
    this.store.stageInstances.set(stage.id, stage)
    
    return { ok: true, data: stage }
  }

  async delete(channelId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers: Record<string, string> = {}
    
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason)

    const result = await this.rest.delete(`/stage-instances/${channelId}`, headers)
    
    if (result.ok) {
      const cached = Array.from(this.store.stageInstances.values()).find(s => s.channelId === channelId)
      if (cached) this.store.stageInstances.delete(cached.id)
    }
    
    return result as ChameleonAPIResult<void>
  }
}