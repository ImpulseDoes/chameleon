import { describe, it, expect, vi } from 'vitest'
import { Client } from '../src/client/client.ts'

describe('Client event pipeline', () => {

  it('awaits async middleware in order before listeners', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const order: string[] = []

    client.use(async (_event, next) => {
      order.push('mw1:start')
      await Promise.resolve()
      await next()
      order.push('mw1:end')
    })

    client.use(async (_event, next) => {
      order.push('mw2:start')
      await Promise.resolve()
      await next()
      order.push('mw2:end')
    })

    client.on('READY', async () => {
      order.push('listener')
    })

    await client['dispatch']('READY', { type: 'READY' })

    expect(order).toEqual([
      'mw1:start',
      'mw2:start',
      'listener',
      'mw2:end',
      'mw1:end'
    ])
  })

  it('isolates listener failures without stopping later listeners', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const order: string[] = []

    client.on('READY', async () => {
      order.push('bad')
      throw new Error('boom')
    })

    client.on('READY', async () => {
      order.push('good')
    })

    await client['dispatch']('READY', { type: 'READY' })

    expect(order).toEqual(['bad', 'good'])
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})