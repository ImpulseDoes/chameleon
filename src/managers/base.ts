import type { ChameleonREST } from '../rest/index.js'
import type { TongueStore } from '../client/store.js'
import type { Tongue } from '../utils/tongue.js'
import type { ChameleonAPIResult } from '../rest/types.js'

export abstract class BaseManager<T extends { id: string }> {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore
  ) {}

  protected abstract endpoint(id: string): string
  protected abstract build(raw: unknown): T
  protected abstract storeKey: keyof TongueStore

  async fetch(id: string, force = false): Promise<ChameleonAPIResult<T>> {

    if (!force) {

      const tongue = this.store[this.storeKey] as unknown as Tongue<string, T>
      const cached = tongue.get(id)

      if (cached) return { ok: true, data: cached }
    }

    const result = await this.rest.get<unknown>(this.endpoint(id))

    if (!result.ok) return result // propagate error

    const entity = this.build(result.data)

    const tongue = this.store[this.storeKey] as unknown as Tongue<string, T>
    tongue.set(id, entity)

    return { ok: true, data: entity }
  }
}