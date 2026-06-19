import type { ChameleonREST } from '../rest/index.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { Sku } from '../types/sku/index.js'
import { toCamelCase } from '../utils/object.js'

export class SkuManager {
  
  constructor(
    protected rest: ChameleonREST
  ) {}

  public async list(applicationId: string): Promise<ChameleonAPIResult<Sku[]>> {

    const result = await this.rest.get<unknown[]>(`/applications/${applicationId}/skus`)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const skus = (result.data as Record<string, unknown>[]).map(s => toCamelCase(s) as unknown as Sku)

    return { ok: true, data: skus }
  }
}