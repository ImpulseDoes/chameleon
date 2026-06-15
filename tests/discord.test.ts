import { describe, it, expect, vi } from 'vitest'
import { toSnakeCase } from '../src/utils/object.ts'
import { ChameleonREST } from '../src/rest/index.ts'
import { Bucket } from '../src/rest/rates.ts'
import { ChameleonGateway } from '../src/gateway/index.ts'

describe('Discord API Compliance', () => {

  describe('Payload Serialization (toSnakeCase)', () => {

    it('should recursively convert camelCase keys to snake_case', () => {
      
      const payload = {
        customId: 'my_button',
        maxValues: 5,
        channelId: '123',
        embeds: [
          {
            titleText: 'Hello',
            authorName: 'impulsedoes'
          }
        ]
      }

      const serialized = toSnakeCase(payload) as Record<string, unknown>

      expect(serialized.custom_id).toBe('my_button')
      expect(serialized.max_values).toBe(5)
      expect(serialized.channel_id).toBe('123')
      
      expect((serialized.embeds as Record<string, unknown>[])[0]!.title_text).toBe('Hello')
      expect((serialized.embeds as Record<string, unknown>[])[0]!.author_name).toBe('impulsedoes')

      expect(serialized.customId).toBeUndefined()
      expect(serialized.maxValues).toBeUndefined()
    })

    it('should correctly handle nulls and primitives', () => {
      expect(toSnakeCase(null)).toBe(null)
      expect(toSnakeCase('string')).toBe('string')
      expect(toSnakeCase(123)).toBe(123)
      expect(toSnakeCase(true)).toBe(true)
    })

    it('should respect custom toJSON methods and not deep transform them', () => {
      
      const component = {
        customId: 'btn',
        toJSON() {
          return { type: 2, custom_id: 'btn_overridden' }
        }
      }

      const payload = {
        components: [component]
      }

      const serialized = toSnakeCase(payload) as Record<string, unknown>

      expect((serialized.components as Record<string, unknown>[])[0]!.type).toBe(2)
      expect((serialized.components as Record<string, unknown>[])[0]!.custom_id).toBe('btn_overridden')
      // Shouldn't see custom_id: 'btn' from the raw component properties
    })
  })

  describe('REST Client Headers & URLs', () => {

    it('should inject required Discord User-Agent and Authorization headers', async () => {
      
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ id: '123' })
      } as Response)

      const rest = new ChameleonREST({ token: 'test_token', version: 10 })
      
      await rest.get('/users/@me')

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      
      const [url, init] = fetchSpy.mock.calls[0]!
      
      expect(url).toBe('https://discord.com/api/v10/users/@me')
      
      const headers = init?.headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bot test_token')
      expect(headers['User-Agent']).toMatch(/^Chameleon \(https:\/\/github.com\/impulsedoes\/chameleon\)$/)

      fetchSpy.mockRestore()
    })

    it('should prepend a slash to the endpoint if missing', async () => {
      
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({})
      } as Response)

      const rest = new ChameleonREST({ token: 'test_token', version: 9 })
      
      await rest.post('channels/123/messages', { content: 'hello' })

      const [url] = fetchSpy.mock.calls[0]!
      expect(url).toBe('https://discord.com/api/v9/channels/123/messages')

      fetchSpy.mockRestore()
    })

    it('should serialize JSON body and set Content-Type appropriately', async () => {

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({})
      } as Response)

      const rest = new ChameleonREST({ token: 'test' })
      
      await rest.post('/test', { foo: 'bar' })

      const [, init] = fetchSpy.mock.calls[0]!
      
      const headers = init?.headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
      
      expect(init?.body).toBe(JSON.stringify({ foo: 'bar' }))

      fetchSpy.mockRestore()
    })

    it('should include audit log reasons in headers when provided', async () => {

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({})
      } as Response)

      const rest = new ChameleonREST({ token: 'test' })
      
      await rest.delete('/channels/123', { 'X-Audit-Log-Reason': encodeURIComponent('Because I can') })

      const [, init] = fetchSpy.mock.calls[0]!
      
      const headers = init?.headers as Record<string, string>
      expect(headers['X-Audit-Log-Reason']).toBe('Because%20I%20can')

      fetchSpy.mockRestore()
    })
  })

  describe('Rate limiter resilience', () => {

    it('should continue processing queued requests after a rejection', async () => {

      const bucket = new Bucket()

      await expect(bucket.queue(async () => {
        throw new Error('first failed')
      })).rejects.toThrow('first failed')

      await expect(bucket.queue(async () => 'second ok')).resolves.toBe('second ok')
    })
  })

  describe('Gateway disconnect behavior', () => {

    it('should not schedule reconnect after manual disconnect', () => {

      const gateway = new ChameleonGateway({ token: 'test', intents: 0 })
      const connectSpy = vi.spyOn(gateway, 'connect').mockImplementation(() => {})

      ;(gateway as unknown as { manualDisconnect: boolean }).manualDisconnect = true
      ;(gateway as unknown as { onClose(event: CloseEvent): void }).onClose({ code: 1000, reason: 'bye' } as CloseEvent)

      expect(connectSpy).not.toHaveBeenCalled()
    })
  })
})