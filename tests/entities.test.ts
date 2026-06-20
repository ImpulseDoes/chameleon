import { describe, it, expect } from 'vitest'
import { TEST_ENTITIES } from './mock/dataTest.js'
import { resolveChannel, resolveGuild, resolveUser, resolveRole, buildMessage, buildGuild, buildInvite } from '../src/builders/index.ts'
import { buildInteraction, buildSoundboardSound, buildSubscription, buildAuditLogEntry } from '../src/builders/entities.ts'
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
    expect(user.verified).toBe(false)
    expect(user.email).toBe(null)
  })

  it('should build a Guild POJO correctly', () => {

    const guild = TEST_ENTITIES.GUILD()

    expect(guild.id).toBe('619434557472505857')
    expect(guild.name).toBe('test-guild')
    expect(guild.ownerId).toBe('301655085954367490')
    expect(guild.region).toBe('us-west')
    expect(guild.maxMembers).toBe(250000)
    expect(guild.approximateMemberCount).toBe(1)
    expect(guild.stickers).toEqual([])
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
    expect(role.tags).toEqual({})
  })

  it('should build a Member POJO correctly', () => {

    const member = TEST_ENTITIES.MEMBER()

    expect(member.user?.id).toBe('301655085954367490')
    expect(member.roles).toEqual([])
    expect(member.permissions).toBe('0')
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

  it('should normalize soundboard, subscription and audit payloads', () => {

    const sound = buildSoundboardSound({
      name: 'boom',
      sound_id: 's1',
      volume: 0.5,
      emoji_id: 'e1',
      emoji_name: null,
      guild_id: 'g1',
      available: true,
      user: { id: 'u1', username: 'john', discriminator: '0001', avatar: null, global_name: null }
    })

    const subscription = buildSubscription({
      id: 'sub1',
      user_id: 'u1',
      sku_ids: ['sku1'],
      entitlement_ids: ['ent1'],
      renewal_sku_ids: null,
      current_period_start: '2024-01-01T00:00:00.000Z',
      current_period_end: '2024-02-01T00:00:00.000Z',
      status: 0,
      canceled_at: null
    })

    const entry = buildAuditLogEntry({
      target_id: 't1',
      user_id: 'u1',
      id: 'a1',
      action_type: 10,
      options: { application_id: 'app1' }
    })

    expect(sound.soundId).toBe('s1')
    expect(sound.guildId).toBe('g1')
    expect(subscription.userId).toBe('u1')
    expect(subscription.currentPeriodStart).toBe(Date.parse('2024-01-01T00:00:00.000Z'))
    expect(entry.userId).toBe('u1')
    expect(entry.options?.applicationId).toBe('app1')
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

  it('should map extended message fields and interaction context', () => {

    const cache = new TongueStore()
    const msg = buildMessage({
      id: 'msg3',
      channel_id: 'ch1',
      guild_id: 'g1',
      content: 'hello',
      timestamp: '2024-01-01T00:00:00.000Z',
      author: { id: 'u1', username: 'john', discriminator: '0001', avatar: null },
      mentions: [],
      mention_roles: [],
      mention_channels: [{ id: 'ch2', guild_id: 'g1', type: 0, name: 'rules' }],
      attachments: [{ id: 'a1', filename: 'x.png', size: 1, url: 'u', proxy_url: 'p', content_type: 'image/png' }],
      embeds: [{ title: 'Embed', timestamp: '2024-01-01T01:00:00.000Z' }],
      pinned: false,
      tts: false,
      type: 0,
      nonce: 'n1',
      activity: { type: 1, party_id: 'party' },
      application: { id: 'app1', name: 'app', icon: null, description: '', bot_public: true, bot_require_code_grant: false, verify_key: 'key', team: null },
      application_id: 'app1',
      position: 7,
      role_subscription_data: { role_subscription_listing_id: 'r1', tier_name: 'gold', total_months_subscribed: 2, is_renewal: true },
      resolved: { users: { u1: { id: 'u1', username: 'john' } } },
      shared_client_theme: { colors: ['#fff'], gradient_angle: 90, base_mix: 1 },
      member: { roles: [], joined_at: '2024-01-01T00:00:00.000Z', deaf: false, mute: false, flags: 0 }
    }, cache)

    const interaction = buildInteraction({
      id: 'i2',
      application_id: 'app1',
      type: 2,
      token: 'tok',
      version: 1,
      guild: { id: 'g1', name: 'guild', icon: null, splash: null, discovery_splash: null, owner_id: 'u1', afk_channel_id: null, afk_timeout: 0, verification_level: 0, default_message_notifications: 0, explicit_content_filter: 0, roles: [], emojis: [], features: [], mfa_level: 0, system_channel_id: null, system_channel_flags: 0, rules_channel_id: null, member_count: 1, vanity_url_code: null, description: null, banner: null, premium_tier: 0, premium_subscription_count: 0, preferred_locale: 'en-US', public_updates_channel_id: null, nsfw_level: 0, premium_progress_bar_enabled: false, application_id: null },
      guild_id: 'g1',
      channel: { id: 'ch1', type: 0, name: 'general' },
      channel_id: 'ch1',
      data: { id: 'cmd1', name: 'x', type: 1, resolved: { channels: { ch1: { id: 'ch1', guild_id: 'g1' } } } },
      message: { id: 'm1', content: 'x' }
    })

    expect(msg.mentionChannels?.[0]?.guildId).toBe('g1')
    expect(msg.attachments[0]?.proxyUrl).toBe('p')
    expect(msg.embeds[0]?.timestamp).toBe(Date.parse('2024-01-01T01:00:00.000Z'))
    expect(msg.nonce).toBe('n1')
    expect(msg.activity?.partyId).toBe('party')
    expect(msg.applicationId).toBe('app1')
    expect(msg.position).toBe(7)
    expect(msg.roleSubscriptionData?.tierName).toBe('gold')
    expect(msg.resolved?.users?.u1?.username).toBe('john')
    expect(msg.sharedClientTheme?.gradientAngle).toBe(90)
    expect(msg.member?.joinedAt).toBe(Date.parse('2024-01-01T00:00:00.000Z'))
    expect(interaction.guild?.id).toBe('g1')
    expect(interaction.channel?.id).toBe('ch1')
    expect((interaction.data as { resolved?: { channels?: Record<string, { guildId?: string }> } }).resolved?.channels?.ch1?.guildId).toBe('g1')
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