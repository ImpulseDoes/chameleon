import type { ChameleonAPIResult, ChameleonRESTOptions, HttpMethod } from './types.js'
import { RateLimiter } from './rates.js'
import type { AttachmentBuilder } from '../builders/attachment.js'

export class ChameleonREST {

  public readonly token: string
  public readonly version: number
  private readonly baseUrl: string
  private readonly limiter: RateLimiter

  constructor(options: ChameleonRESTOptions) {
    this.token = options.token
    this.version = options.version ?? 10
    this.baseUrl = `https://discord.com/api/v${this.version}`
    this.limiter = new RateLimiter()
  }

  /**
   * Internal generic request handler that doesn't throw, returning `{ ok: boolean, ... }` shape
   */
  public async request<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ChameleonAPIResult<T>> {
    
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${path}`

    const reqHeaders: Record<string, string> = {
      'Authorization': `Bot ${this.token}`,
      'User-Agent': 'Chameleon (https://github.com/impulsedoes/chameleon)',
      ...headers
    }

    let reqBody: string | undefined = undefined

    if (body) {
      reqHeaders['Content-Type'] = 'application/json'
      reqBody = JSON.stringify(body)
    }

    try {

      const response = await this.limiter.execute(method, path, () => fetch(url, {
        method,
        headers: reqHeaders,
        ...(reqBody !== undefined ? { body: reqBody } : {})
      }))

      let data: unknown = null

      if (response.status !== 204) {

        const text = await response.text()

        if (text) {
          try {
            data = JSON.parse(text)
          } catch {
            data = text
          }
        }
      }

      if (response.ok) {
        return { ok: true, data: data as T }
      }

      const errData = data as Record<string, unknown> | null

      return {
        ok: false,
        status: response.status,
        ...(typeof errData?.code === 'number' ? { code: errData.code } : {}),
        error: typeof errData?.message === 'string' ? errData.message : response.statusText,
        message: typeof errData?.message === 'string' ? errData.message : response.statusText,
        raw: data
      }

    } catch (error: unknown) {
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown network error',
        message: error instanceof Error ? error.message : 'Unknown network error'
      }
    }
  }

  public get<T = unknown>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>('GET', endpoint, undefined, headers)
  }

  public post<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>('POST', endpoint, body, headers)
  }

  public put<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>('PUT', endpoint, body, headers)
  }

  public patch<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>('PATCH', endpoint, body, headers)
  }

  public delete<T = unknown>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>('DELETE', endpoint, undefined, headers)
  }

  public async requestWithFiles<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    body: unknown,
    files: AttachmentBuilder[],
    headers?: Record<string, string>
  ): Promise<ChameleonAPIResult<T>> {

    const routePath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${routePath}`

    const reqHeaders: Record<string, string> = {
      'Authorization': `Bot ${this.token}`,
      'User-Agent': 'Chameleon (https://github.com/impulsedoes/chameleon)',
      ...headers
    }

    const formData = new FormData()

    const jsonPayload = {
      ...(body as Record<string, unknown> ?? {}),
      attachments: files.map((f, i) => f.toAttachmentJSON(i))
    }
    formData.append('payload_json', JSON.stringify(jsonPayload))

    for (let i = 0; i < files.length; i++) {

      const file = files[i]!
      const uint8 = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data)
      const blob = new Blob([uint8 as unknown as BlobPart], { type: file.contentType ?? 'application/octet-stream' })
      
      formData.append(`files[${i}]`, blob, file.name)
    }

    try {

      const response = await this.limiter.execute(method, routePath, () => fetch(url, {
        method,
        headers: reqHeaders,
        body: formData
      }))

      let data: unknown = null

      if (response.status !== 204) {

        const text = await response.text()
        
        if (text) {
          try {
            data = JSON.parse(text)
          } catch {
            data = text
          }
        }
      }

      if (response.ok) {
        return { ok: true, data: data as T }
      }

      const errData = data as Record<string, unknown> | null

      return {
        ok: false,
        status: response.status,
        ...(typeof errData?.code === 'number' ? { code: errData.code } : {}),
        error: typeof errData?.message === 'string' ? errData.message : response.statusText,
        message: typeof errData?.message === 'string' ? errData.message : response.statusText,
        raw: data
      }

    } catch (error: unknown) {
      
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown network error',
        message: error instanceof Error ? error.message : 'Unknown network error'
      }
    }
  }
}