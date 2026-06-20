import { describe, it, expect, vi } from 'vitest'
import { GuildManager } from '../src/managers/guild.ts'
import { Client } from '../src/client/client.ts'

describe('GuildManager', () => {

  it('should fetch channels successfully', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const manager = new GuildManager(client.rest, client.cache)
    
    // Mock rest client
    manager['rest'].get = vi.fn().mockResolvedValue({
      ok: true,
      data: [{ id: 'ch1', type: 0, name: 'general' }]
    })

    const res = await manager.fetchChannels('g1')

    expect(res.ok).toBe(true)

    if (res.ok) {
      expect(res.data).toHaveLength(1)
      expect(res.data?.[0]?.id).toBe('ch1')
    }
  })

  it('should handle fetch channels failure', async () => {
    
    const client = new Client({ token: 'test', intents: [] })
    const manager = new GuildManager(client.rest, client.cache)
    
    manager['rest'].get = vi.fn().mockResolvedValue({
      ok: false,
      error: 'Not found'
    })

    const res = await manager.fetchChannels('g1')
    expect(res.ok).toBe(false)
  })

  it('should ban a user', async () => {
    const client = new Client({ token: 'test', intents: [] })
    const manager = new GuildManager(client.rest, client.cache)
    
    manager['rest'].put = vi.fn().mockResolvedValue({ ok: true })

    const res = await manager.ban('g1', 'u1', { deleteMessageSeconds: 600, reason: 'Spam' })
    expect(res.ok).toBe(true)
    
    expect(manager['rest'].put).toHaveBeenCalledWith(
      '/guilds/g1/bans/u1',
      { delete_message_seconds: 600 },
      { 'X-Audit-Log-Reason': 'Spam' }
    )
  })

  it('should unban a user', async () => {
    const client = new Client({ token: 'test', intents: [] })
    const manager = new GuildManager(client.rest, client.cache)
    
    manager['rest'].delete = vi.fn().mockResolvedValue({ ok: true })

    const res = await manager.unban('g1', 'u1', 'Forgiven')
    expect(res.ok).toBe(true)
    
    expect(manager['rest'].delete).toHaveBeenCalledWith(
      '/guilds/g1/bans/u1',
      { 'X-Audit-Log-Reason': 'Forgiven' }
    )
  })

  it('should kick a user', async () => {
    const client = new Client({ token: 'test', intents: [] })
    const manager = new GuildManager(client.rest, client.cache)
    
    manager['rest'].delete = vi.fn().mockResolvedValue({ ok: true })
    
    // Add fake member to cache to test deletion
    client.cache.members.set('g1_u1', {} as unknown as import('../src/types/guild/index.ts').Member)

    const res = await manager.kick('g1', 'u1', 'nga')

    expect(res.ok).toBe(true)
    
    expect(manager['rest'].delete).toHaveBeenCalledWith(
      '/guilds/g1/members/u1',
      { 'X-Audit-Log-Reason': encodeURIComponent('nga') }
    )
    
    // Should have deleted from cache
    expect(client.cache.members.has('g1_u1')).toBe(false)
  })

  it('should keep invite metadata on guild invite fetch', async () => {

    const client = new Client({ token: 'test', intents: [] })
    const manager = new GuildManager(client.rest, client.cache)

    manager['rest'].get = vi.fn().mockResolvedValue({
      ok: true,
      data: [{
        code: 'abc123',
        type: 0,
        channel: { id: 'ch1', type: 0 },
        uses: 3,
        max_uses: 5,
        max_age: 900,
        temporary: false,
        created_at: '2024-02-03T04:05:06.000Z'
      }]
    })

    const res = await manager.getInvites('g1')

    expect(res.ok).toBe(true)

    if (res.ok) {
      expect(res.data[0]?.uses).toBe(3)
      expect(res.data[0]?.maxUses).toBe(5)
      expect(res.data[0]?.maxAge).toBe(900)
      expect(res.data[0]?.temporary).toBe(false)
      expect(res.data[0]?.createdAt).toBe(Date.parse('2024-02-03T04:05:06.000Z'))
    }
  })
})