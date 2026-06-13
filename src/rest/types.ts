export type ChameleonAPIResult<T> = 
  | { ok: true, data: T }
  | { ok: false, status: number, code?: number, error: string, message: string, raw?: unknown }

export interface ChameleonRESTOptions {
  token: string
  version?: number
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'