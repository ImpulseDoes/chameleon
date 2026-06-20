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

  it('normalizes thread sync members and application command permissions events', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const seen: Array<unknown> = []

    client.on('THREAD_LIST_SYNC', event => {
      seen.push(event)
    })

    client.on('APPLICATION_COMMAND_PERMISSIONS_UPDATE', event => {
      seen.push(event)
    })

    await client['handleDispatch']({
      t: 'THREAD_LIST_SYNC',
      d: {
        guild_id: 'g1',
        threads: [{ id: 'th1', guild_id: 'g1', type: 11 }],
        members: [{ id: 'th1', user_id: 'u1', join_timestamp: '2024-01-01T00:00:00.000Z', flags: 1 }]
      }
    } as import('../src/gateway/index.ts').GatewayPayload)

    await client['handleDispatch']({
      t: 'APPLICATION_COMMAND_PERMISSIONS_UPDATE',
      d: {
        id: 'cmd1',
        application_id: 'app1',
        guild_id: 'g1',
        permissions: [{ id: 'role1', type: 1, permission: true }]
      }
    } as import('../src/gateway/index.ts').GatewayPayload)

    const threadEvent = seen[0] as Extract<import('../src/events/index.ts').ChameleonEvent, { type: 'THREAD_LIST_SYNC' }>
    const permissionsEvent = seen[1] as Extract<import('../src/events/index.ts').ChameleonEvent, { type: 'APPLICATION_COMMAND_PERMISSIONS_UPDATE' }>

    expect(threadEvent.members[0]?.userId).toBe('u1')
    expect(threadEvent.members[0]?.joinTimestamp).toBe(Date.parse('2024-01-01T00:00:00.000Z'))
    expect(permissionsEvent.permissions[0]?.applicationId).toBe('app1')
    expect(permissionsEvent.permissions[0]?.permissions[0]?.permission).toBe(true)
  })

  it('normalizes soundboard, subscription and audit gateway events', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const seen: Array<unknown> = []

    client.on('GUILD_SOUNDBOARD_SOUND_CREATE', event => { seen.push(event) })
    client.on('SUBSCRIPTION_CREATE', event => { seen.push(event) })
    client.on('GUILD_AUDIT_LOG_ENTRY_CREATE', event => { seen.push(event) })

    await client['handleDispatch']({
      t: 'GUILD_SOUNDBOARD_SOUND_CREATE',
      d: { guild_id: 'g1', name: 'boom', sound_id: 's1', volume: 1, emoji_id: null, emoji_name: null, available: true }
    } as import('../src/gateway/index.ts').GatewayPayload)

    await client['handleDispatch']({
      t: 'SUBSCRIPTION_CREATE',
      d: {
        id: 'sub1',
        user_id: 'u1',
        sku_ids: ['sku1'],
        entitlement_ids: ['ent1'],
        renewal_sku_ids: null,
        current_period_start: '2024-01-01T00:00:00.000Z',
        current_period_end: '2024-02-01T00:00:00.000Z',
        status: 0,
        canceled_at: null
      }
    } as import('../src/gateway/index.ts').GatewayPayload)

    await client['handleDispatch']({
      t: 'GUILD_AUDIT_LOG_ENTRY_CREATE',
      d: {
        guild_id: 'g1',
        target_id: 't1',
        user_id: 'u1',
        id: 'a1',
        action_type: 10,
        options: { application_id: 'app1' }
      }
    } as import('../src/gateway/index.ts').GatewayPayload)

    const soundEvent = seen[0] as Extract<import('../src/events/index.ts').ChameleonEvent, { type: 'GUILD_SOUNDBOARD_SOUND_CREATE' }>
    const subscriptionEvent = seen[1] as Extract<import('../src/events/index.ts').ChameleonEvent, { type: 'SUBSCRIPTION_CREATE' }>
    const auditEvent = seen[2] as Extract<import('../src/events/index.ts').ChameleonEvent, { type: 'GUILD_AUDIT_LOG_ENTRY_CREATE' }>

    expect(soundEvent.sound.soundId).toBe('s1')
    expect(subscriptionEvent.subscription.userId).toBe('u1')
    expect(auditEvent.entry.options?.applicationId).toBe('app1')
  })
})