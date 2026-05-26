import { describe, it, expect, vi } from 'vitest'
import { ComponentManager } from '../src/components/manager.ts'
import { Client } from '../src/client/client.ts'
import { defineButton, defineUserSelect, defineChannelSelect } from '../src/components/define.ts'
import { ComponentContext } from '../src/components/context.ts'

describe('ComponentManager', () => {

  it('should register components', () => {

    const client = new Client({ token: 'test', intents: [] })
    const manager = new ComponentManager(client)
    
    const btn = defineButton({ customId: 'btn1', style: 1 })
    manager.register(btn)
    
    expect(manager['handlers'].has('btn1')).toBe(true)
    expect(manager['handlers'].get('btn1')).toBe(btn)
  })

  it('should ignore interactions without matching handler', async () => {
    
    const client = new Client({ token: 'test', intents: [] })
    const manager = new ComponentManager(client)
    
    // Should not throw or do anything
    await manager.handleInteraction({ data: { custom_id: 'unknown' } })
    await manager.handleInteraction({ data: {} })
  })

  it('should handle button interaction', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const manager = new ComponentManager(client)
    
    let executedCtx: ComponentContext | undefined
    
    const btn = defineButton({
      customId: 'btn1',
      style: 1,
      execute: async (ctx) => {
        executedCtx = ctx
      }
    })
    manager.register(btn)
    
    const rawInteraction = {
      id: 'i1',
      token: 't1',
      application_id: 'a1',
      data: { custom_id: 'btn1' },
      user: { id: 'u1', username: 'john' },
      guild_id: 'g1',
      channel_id: 'c1'
    }

    await manager.handleInteraction(rawInteraction)
    
    expect(executedCtx).toBeDefined()
    expect(executedCtx?.user.id).toBe('u1')
    expect(executedCtx?.guild?.id).toBe('g1')
    expect(executedCtx?.channel?.id).toBe('c1')
  })

  it('should handle user select and hydrate members', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const manager = new ComponentManager(client)
    
    let executedCtx: ComponentContext<import('../src/types/user/index.ts').User[]> | undefined
    
    const sel = defineUserSelect({
      customId: 'u_sel',
      execute: async (ctx) => {
        executedCtx = ctx
      }
    })
    manager.register(sel as unknown)

    const rawInteraction = {
      data: {
        custom_id: 'u_sel',
        resolved: {
          users: {
            'target1': { id: 'target1', username: 'jane' }
          },
          members: {
            'target1': { roles: ['r1'] }
          }
        },
        values: ['target1']
      },
      member: { user: { id: 'u1' } },
      guild_id: 'g1'
    }

    await manager.handleInteraction(rawInteraction)

    expect(executedCtx).toBeDefined()
    // Test values resolution mapping
    expect(executedCtx?.values).toHaveLength(1)
    expect(executedCtx?.values[0]?.id).toBe('target1')
    expect(executedCtx?.values[0]?.username).toBe('jane')
    
    // Test that the user was hydrated into cache
    expect(client.cache.users.has('target1')).toBe(true)
  })

  it('should handle channel select mapping', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const manager = new ComponentManager(client)
    
    let executedCtx: ComponentContext<Partial<import('../src/types/channel/index.ts').Channel>[]> | undefined
    
    const sel = defineChannelSelect({
      customId: 'c_sel',
      execute: async (ctx) => {
        executedCtx = ctx
      }
    })
    manager.register(sel as unknown)

    const rawInteraction = {
      data: {
        custom_id: 'c_sel',
        resolved: {
          channels: {
            'c1': { id: 'c1', type: 0, name: 'general' }
          }
        },
        values: ['c1', 'unknown_channel']
      },
      user: { id: 'u1' }
    }

    await manager.handleInteraction(rawInteraction)

    expect(executedCtx).toBeDefined()
    expect(executedCtx?.values).toHaveLength(2)
    expect(executedCtx?.values[0]?.id).toBe('c1')
    expect(executedCtx?.values[0]?.name).toBe('general')
    expect(executedCtx?.values[1]?.id).toBe('unknown_channel') // Fallback to id-only object
  })

  it('should catch handler errors', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const manager = new ComponentManager(client)
    
    const btn = defineButton({
      customId: 'bad_btn',
      style: 1,
      execute: async () => {
        throw new Error('Handler crash')
      }
    })
    manager.register(btn)
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) // Spy on console

    await manager.handleInteraction({
      data: { custom_id: 'bad_btn' },
      user: { id: 'u1' }
    })

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})