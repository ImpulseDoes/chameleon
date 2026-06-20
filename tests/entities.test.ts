import { describe, it, expect } from 'vitest'
import { TEST_ENTITIES } from './mock/dataTest.js'
import { resolveChannel, resolveGuild, resolveUser, resolveRole, buildMessage, buildGuild, buildInvite } from '../src/builders/index.ts'
import { buildInteraction } from '../src/builders/entities.ts'
import { TongueStore } from '../src/client/store.ts'
import type { Client } from '../src/client/client.ts'
import type { Channel } from '../src/types/channel/index.ts'
import type { Guild, Role } from '../src/types/guild/index.ts'
import type { User } from '../src/types/user/index.ts'

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

  it('should preserve invite metadata when present in the REST payload', () => {

    const invite = buildInvite({
      code: 'abc123',
      type: 0,
      channel: { id: 'ch1', type: 0 },
      uses: 7,
      max_uses: 10,
      max_age: 3600,
      temporary: true,
      created_at: '2024-01-02T03:04:05.000Z',
      expires_at: '2024-01-02T04:04:05.000Z'
    })

    expect(invite.uses).toBe(7)
    expect(invite.maxUses).toBe(10)
    expect(invite.maxAge).toBe(3600)
    expect(invite.temporary).toBe(true)
    expect(invite.createdAt).toBe(Date.parse('2024-01-02T03:04:05.000Z'))
    expect(invite.expiresAt).toBe(Date.parse('2024-01-02T04:04:05.000Z'))
  })
})

describe('Chameleon Entity Resolvers', () => {

  it('should resolve from cache or fallback to ID', () => {

    const cache = new TongueStore()
    const client = { cache } as unknown as Client
    
    cache.channels.set('ch1', { id: 'ch1', type: 0 } as unknown as Channel)
    cache.guilds.set('g1', { id: 'g1', name: 'g' } as unknown as Guild)
    cache.users.set('u1', { id: 'u1', username: 'u' } as unknown as User)
    cache.roles.set('r1', { id: 'r1', name: 'r' } as unknown as Role)

    expect(resolveChannel('ch1', client)).toHaveProperty('type', 0)
    expect(resolveChannel('ch2', client)).toEqual(expect.objectContaining({ id: 'ch2' }))

    expect(resolveGuild('g1', client)).toHaveProperty('name', 'g')
    expect(resolveGuild('g2', client)).toEqual(expect.objectContaining({ id: 'g2' }))

    expect(resolveUser('u1', client)).toHaveProperty('username', 'u')
    expect(resolveUser('u2', client)).toEqual(expect.objectContaining({ id: 'u2' }))

    expect(resolveRole('r1', client)).toHaveProperty('name', 'r')
    expect(resolveRole('r2', client)).toEqual(expect.objectContaining({ id: 'r2' }))
  })
})

describe('Edge cases', () => {

  it('should normalize component interaction data to camelCase', () => {

    const interaction = buildInteraction({
      id: 'i1',
      application_id: 'app1',
      type: 3,
      token: 'token',
      version: 1,
      data: {
        custom_id: 'btn1',
        component_type: 2,
        values: ['a']
      },
      user: { id: 'u1', username: 'john' },
      entitlements: [],
      authorizing_integration_owners: {}
    })

    expect(interaction.data).toEqual(expect.objectContaining({
      customId: 'btn1',
      componentType: 2,
      values: ['a']
    }))
  })

  it('should build Message with mentions correctly', () => {

    const raw = {
      id: 'msg1',
      content: 'Hello <@user1>',
      mentions: [{ id: 'user1', username: 'john' }]
    }

    const cache = new TongueStore()
    const msg = buildMessage(raw, cache)

    expect(msg.mentions).toHaveLength(1)
    expect(msg.mentions?.[0]?.username).toBe('john')
  })

  it('should expose message presence helpers via has', () => {

    const raw = {
      id: 'msg2',
      channel_id: 'ch1',
      content: 'poll with sticker',
      author: { id: 'user1', username: 'john', discriminator: '0001' },
      mentions: [],
      mention_roles: [],
      attachments: [{ id: 'a1', filename: 'voice.ogg', size: 10, url: 'u', proxy_url: 'p' }],
      embeds: [],
      pinned: true,
      tts: false,
      flags: 1 << 13,
      edited_timestamp: '2022-01-01T00:00:00.000Z',
      type: 6,
      poll: {
        question: { text: 'Question?' },
        answers: [],
        expiry: null,
        allowMultiselect: false,
        layoutType: 1
      },
      sticker_items: [{ id: 'st1', name: 'wave', format_type: 1 }],
      components: [{ type: 1, components: [] }],
      webhook_id: 'wh1',
      message_reference: { message_id: 'parent', type: 1 },
      message_snapshots: [{ message: { content: 'forwarded' } }],
      mention_everyone: true
    }

    const cache = new TongueStore()
    const msg = buildMessage(raw, cache)

    expect(msg.has.poll).toBe(true)
    expect(msg.has.stickers).toBe(true)
    expect(msg.has.components).toBe(true)
    expect(msg.has.webhook).toBe(true)
    expect(msg.has.reply).toBe(true)
    expect(msg.has.forwarded).toBe(true)
    expect(msg.has.pinned).toBe(true)
    expect(msg.has.edited).toBe(true)
    expect(msg.has.voiceMessage).toBe(true)
    expect(msg.has.attachments).toBe(false)
    expect(msg.has.system.any).toBe(true)
    expect(msg.has.system.pinned).toBe(true)
    expect(msg.has.system.booster).toBe(false)
    expect(msg.has.system.welcome).toBe(false)
    expect(msg.has.mentionHere).toBe(false)
  })

  it('should detect welcome and boost system messages', () => {

    const cache = new TongueStore()
    const welcome = buildMessage({
      id: 'msg4',
      channel_id: 'ch1',
      content: '',
      author: { id: 'user1', username: 'john', discriminator: '0001' },
      mentions: [],
      mention_roles: [],
      attachments: [],
      embeds: [],
      pinned: false,
      tts: false,
      type: 7
    }, cache)
    const boost = buildMessage({
      id: 'msg5',
      channel_id: 'ch1',
      content: '',
      author: { id: 'user1', username: 'john', discriminator: '0001' },
      mentions: [],
      mention_roles: [],
      attachments: [],
      embeds: [],
      pinned: false,
      tts: false,
      type: 8
    }, cache)

    expect(welcome.has.system.welcome).toBe(true)
    expect(welcome.has.system.any).toBe(true)
    expect(boost.has.system.booster).toBe(true)
    expect(boost.has.system.welcome).toBe(false)
  })

  it('should detect mentionHere from content heuristically', () => {

    const cache = new TongueStore()
    const msg = buildMessage({
      id: 'msg3',
      channel_id: 'ch1',
      content: 'ping @here',
      author: { id: 'user1', username: 'john', discriminator: '0001' },
      mentions: [],
      mention_roles: [],
      attachments: [],
      embeds: [],
      mention_everyone: true,
      pinned: false,
      tts: false,
      type: 0
    }, cache)

    expect(msg.has.mentionHere).toBe(true)
    expect(msg.has.mentionEveryone).toBe(true)
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
    expect(guild.roles?.[0]?.name).toBe('Admin')
  })
})