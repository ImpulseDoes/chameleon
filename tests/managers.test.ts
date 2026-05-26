import { describe, it, expect, vi } from 'vitest'
import { TongueStore } from '../src/client/store.js'
import { UserManager } from '../src/managers/user.js'
import { GuildManager } from '../src/managers/guild.js'
import { ChannelManager } from '../src/managers/channel.js'
import { RAW_DATA } from './mock/dataTest.js'

function mockRest(response: unknown) {

  return {
    get: vi.fn().mockResolvedValue({ ok: true, data: response }),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  } as unknown as import('../src/rest/index.js').ChameleonREST
}

describe('Managers', () => {

  it('UserManager.fetch returns cached user on second call', async () => {

    const store = new TongueStore()
    const rest = mockRest(RAW_DATA.CLIENT_USER)
    const users = new UserManager(rest, store)

    const first = await users.fetch('704802632660943089')

    expect(first.ok).toBe(true)

    if (!first.ok) return

    expect(first.data.username).toBe('impulsedoes')
    expect(rest.get).toHaveBeenCalledTimes(1)

    const second = await users.fetch('704802632660943089')

    expect(second.ok).toBe(true)
    expect(rest.get).toHaveBeenCalledTimes(1)
  })

  it('UserManager.fetch with force bypasses cache', async () => {

    const store = new TongueStore()
    const rest = mockRest(RAW_DATA.CLIENT_USER)
    const users = new UserManager(rest, store)

    await users.fetch('704802632660943089')
    await users.fetch('704802632660943089', true)

    expect(rest.get).toHaveBeenCalledTimes(2)
  })

  it('GuildManager.fetch builds guild POJO', async () => {

    const store = new TongueStore()
    const rest = mockRest(RAW_DATA.GUILD)
    const guilds = new GuildManager(rest, store)

    const result = await guilds.fetch('619434557472505857')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('test-guild')
    expect(result.data.ownerId).toBe('301655085954367490')
  })

  it('GuildManager.fetchChannels returns array and caches', async () => {

    const store = new TongueStore()
    const rest = mockRest([RAW_DATA.TEXT_CHANNEL])
    const guilds = new GuildManager(rest, store)

    const result = await guilds.fetchChannels('619434557472505857')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.name).toBe('test-channel')

    const cached = store.channels.get('123456789112345678')

    expect(cached).toBeDefined()
    expect(cached?.name).toBe('test-channel')
  })

  it('ChannelManager.fetch builds channel POJO', async () => {

    const store = new TongueStore()
    const rest = mockRest(RAW_DATA.TEXT_CHANNEL)
    const channels = new ChannelManager(rest, store)

    const result = await channels.fetch('123456789112345678')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.type).toBe(0)
    expect(result.data.name).toBe('test-channel')
  })

  it('propagates REST errors without throwing', async () => {

    const store = new TongueStore()
    const rest = {
      get: vi.fn().mockResolvedValue({ ok: false, status: 404, message: 'Unknown User' }),
    } as unknown as import('../src/rest/index.js').ChameleonREST

    const users = new UserManager(rest, store)
    const result = await users.fetch('999')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(404)
  })
})