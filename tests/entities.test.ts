import { describe, it, expect } from 'vitest'
import { TEST_ENTITIES } from './mock/dataTest.js'
import { resolveChannel, resolveGuild, resolveUser, resolveRole, buildMessage, buildGuild } from '../src/builders/index.ts'
import { TongueStore } from '../src/client/store.ts'

describe('Chameleon Entity Builders', () => {

  it('should build a User POJO correctly', () => {

    const user = TEST_ENTITIES.USER()

    expect(user.id).toBe('704802632660943089')
    expect(user.username).toBe('impulsedoes')
    expect(user.bot).toBe(false)
  })

  it('should build a Guild POJO correctly', () => {

    const guild = TEST_ENTITIES.GUILD()

    expect(guild.id).toBe('619434557472505857')
    expect(guild.name).toBe('test-guild')
    expect(guild.ownerId).toBe('301655085954367490')
  })

  it('should build a Message POJO correctly', () => {

    const message = TEST_ENTITIES.MESSAGE()

    expect(message.id).toBe('123456339012345678')
    expect(message.content).toBe('test message @everyone')
    expect(message.author.username).toBe('test')
  })

  it('should build a Channel POJO correctly', () => {

    const channel = TEST_ENTITIES.CHANNEL()

    expect(channel.id).toBe('123456789112345678')
    expect(channel.type).toBe(0)
  })

  it('should build a Role POJO correctly', () => {

    const role = TEST_ENTITIES.ROLE()

    expect(role.id).toBe('123452789012345678')
    expect(role.name).toBe('admin')
    expect(role.permissions).toBe('8')
  })

  it('should build a Member POJO correctly', () => {

    const member = TEST_ENTITIES.MEMBER()

    expect(member.user?.id).toBe('301655085954367490')
    expect(member.roles).toEqual([])
  })
})

describe('Chameleon Entity Resolvers', () => {

  it('should resolve from cache or fallback to ID', () => {

    const cache = new TongueStore()
    
    cache.channels.set('ch1', { id: 'ch1', type: 0 } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)
    cache.guilds.set('g1', { id: 'g1', name: 'g' } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)
    cache.users.set('u1', { id: 'u1', username: 'u' } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)
    cache.roles.set('r1', { id: 'r1', name: 'r' } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)

    expect(resolveChannel('ch1', cache)).toHaveProperty('type', 0)
    expect(resolveChannel('ch2', cache)).toEqual({ id: 'ch2' })

    expect(resolveGuild('g1', cache)).toHaveProperty('name', 'g')
    expect(resolveGuild('g2', cache)).toEqual({ id: 'g2' })

    expect(resolveUser('u1', cache)).toHaveProperty('username', 'u')
    expect(resolveUser('u2', cache)).toEqual({ id: 'u2' })

    expect(resolveRole('r1', cache)).toHaveProperty('name', 'r')
    expect(resolveRole('r2', cache)).toEqual({ id: 'r2' })
  })
})

describe('Edge cases', () => {

  it('should build Message with mentions correctly', () => {

    const raw = {
      id: 'msg1',
      content: 'Hello <@user1>',
      mentions: [{ id: 'user1', username: 'john' }]
    }

    const cache = new TongueStore()
    const msg = buildMessage(raw, cache)

    expect(msg.mentions).toHaveLength(1)

    expect(msg.mentions[0].username).toBe('john')
  })

  it('should build Guild with roles properly', () => {

    const raw = {
      id: 'g1',
      name: 'Test',
      owner_id: 'owner',
      roles: [{ id: 'r1', name: 'Admin', permissions: '8' }]
    }
    const guild = buildGuild(raw)
    
    expect(guild.roles).toHaveLength(1)

    expect(guild.roles[0].name).toBe('Admin')
  })
})