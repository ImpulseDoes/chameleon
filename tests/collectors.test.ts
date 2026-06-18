import { describe, it, expect } from 'vitest'
import { Client } from '../src/client/client.ts'
import { INTERACTION_TYPES } from '../src/utils/constants.ts'

describe('CollectorManager', () => {

  it('rebuilds component contexts from INTERACTION_CREATE events', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const pending = client.collectors.awaitComponent('m1', { time: 1000 })

    await client['dispatch']('INTERACTION_CREATE', {
      type: 'INTERACTION_CREATE',
      interaction: {
        id: 'i1',
        applicationId: 'app1',
        type: INTERACTION_TYPES.MESSAGE_COMPONENT,
        token: 't1',
        version: 1,
        message: { id: 'm1' } as import('../src/types/message/index.ts').Message,
        user: { id: 'u1', username: 'john' } as import('../src/types/user/index.ts').User,
        data: {
          customId: 'btn1',
          componentType: 2,
          values: ['a', 'b']
        },
        entitlements: [],
        authorizingIntegrationOwners: {}
      }
    })

    const ctx = await pending

    expect(ctx).not.toBeNull()
    expect(ctx?.customId).toBe('btn1')
    expect(ctx?.values).toEqual(['a', 'b'])
    expect(ctx?.message?.id).toBe('m1')
  })
})