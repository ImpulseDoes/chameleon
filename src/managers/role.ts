import type { ChameleonREST } from '../rest/index.js'
import { TongueStore } from '../client/store.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import type { Role } from '../types/guild/index.js'
import { buildRole } from '../builders/index.js'
import { toSnakeCase } from '../utils/object.js'
import { createAuditLogHeaders } from './shared.js'

export class RoleManager {

  constructor (
    protected rest: ChameleonREST,
    protected store: TongueStore,
    protected guildId: string
  ) {}

  async fetch(roleId: string, force = false): Promise<ChameleonAPIResult<Role>> {

    if (!force) {

      const cached = this.store.roles.get(roleId)

      if (cached) return { ok: true, data: cached }
    }

    const result = await this.rest.get<unknown[]>(`/guilds/${this.guildId}/roles`)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const roles = result.data.map(raw => buildRole(raw as Record<string, unknown>))

    for (const r of roles) {
      this.store.roles.set(r.id, r)
    }

    const target = roles.find(r => r.id === roleId)

    if (target) return { ok: true, data: target }

    return { ok: false, status: 404, error: 'Role not found', message: 'Role not found' } as ChameleonAPIResult<never>
  }

  async list(): Promise<ChameleonAPIResult<Role[]>> {

    const result = await this.rest.get<unknown[]>(`/guilds/${this.guildId}/roles`)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const roles = result.data.map(raw => buildRole(raw as Record<string, unknown>))

    for (const r of roles) {
      this.store.roles.set(r.id, r)
    }

    return { ok: true, data: roles }
  }

  async create(payload: Partial<Role>, reason?: string): Promise<ChameleonAPIResult<Role>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.post<unknown>(`/guilds/${this.guildId}/roles`, toSnakeCase(payload), headers)
    if (!result.ok) return result as ChameleonAPIResult<never>

    const role = buildRole(result.data as Record<string, unknown>)
    this.store.roles.set(role.id, role)

    return { ok: true, data: role }
  }

  async edit(roleId: string, payload: Partial<Role>, reason?: string): Promise<ChameleonAPIResult<Role>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.patch<unknown>(`/guilds/${this.guildId}/roles/${roleId}`, toSnakeCase(payload), headers)

    if (!result.ok) return result as ChameleonAPIResult<never>

    const role = buildRole(result.data as Record<string, unknown>)
    this.store.roles.set(role.id, role)

    return { ok: true, data: role }
  }

  async delete(roleId: string, reason?: string): Promise<ChameleonAPIResult<void>> {

    const headers = createAuditLogHeaders(reason)

    const result = await this.rest.delete(`/guilds/${this.guildId}/roles/${roleId}`, headers)

    if (result.ok) this.store.roles.delete(roleId)

    return result as ChameleonAPIResult<void>
  }
}