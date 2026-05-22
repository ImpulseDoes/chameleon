import type { User } from '../types/user/index.js'
import type { Channel } from '../types/channel/index.js'
import type { Guild, Member, Role } from '../types/guild/index.js'
import type { Message } from '../types/message/index.js'
import type { Emoji } from '../types/expressions/index.js'
import type { TongueStore } from '../client/store.js'

export * from './embed.js'
export * from './components.js'

export function buildUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    username: raw.username as string,
    discriminator: raw.discriminator as string,
    globalName: (raw.global_name as string | null) ?? null,
    avatar: (raw.avatar as string | null) ?? null,
    bot: (raw.bot as boolean) ?? false,
    system: (raw.system as boolean) ?? false,
    mfaEnabled: (raw.mfa_enabled as boolean) ?? false,
    banner: (raw.banner as string | null) ?? null,
    accentColor: (raw.accent_color as number | null) ?? null,
    locale: (raw.locale as string) ?? undefined,
    flags: (raw.flags as number) ?? 0,
    premiumType: (raw.premium_type as number) ?? 0,
    publicFlags: (raw.public_flags as number) ?? 0,
  } as User
}

export function buildChannel(raw: Record<string, unknown>, guildId?: string): Channel {
  return {
    id: raw.id as string,
    type: raw.type as number,
    guildId: (raw.guild_id as string) ?? guildId ?? undefined,
    name: (raw.name as string | null) ?? null,
    position: (raw.position as number) ?? 0,
    parentId: (raw.parent_id as string | null) ?? null,
    topic: (raw.topic as string | null) ?? null,
    nsfw: (raw.nsfw as boolean) ?? false,
    lastMessageId: (raw.last_message_id as string | null) ?? null,
    bitrate: (raw.bitrate as number) ?? undefined,
    userLimit: (raw.user_limit as number) ?? undefined,
    rateLimitPerUser: (raw.rate_limit_per_user as number) ?? 0,
    permissionOverwrites: (raw.permission_overwrites as unknown[]) ?? [],
  } as Channel
}

export function buildGuild(raw: Record<string, unknown>): Guild {
  return {
    id: raw.id as string,
    name: raw.name as string,
    icon: (raw.icon as string | null) ?? null,
    splash: (raw.splash as string | null) ?? null,
    discoverySplash: (raw.discovery_splash as string | null) ?? null,
    ownerId: raw.owner_id as string,
    afkChannelId: (raw.afk_channel_id as string | null) ?? null,
    afkTimeout: (raw.afk_timeout as number) ?? 0,
    verificationLevel: (raw.verification_level as number) ?? 0,
    defaultMessageNotifications: (raw.default_message_notifications as number) ?? 0,
    explicitContentFilter: (raw.explicit_content_filter as number) ?? 0,
    features: (raw.features as string[]) ?? [],
    mfaLevel: (raw.mfa_level as number) ?? 0,
    systemChannelId: (raw.system_channel_id as string | null) ?? null,
    systemChannelFlags: (raw.system_channel_flags as number) ?? 0,
    rulesChannelId: (raw.rules_channel_id as string | null) ?? null,
    memberCount: (raw.member_count as number) ?? 0,
    vanityUrlCode: (raw.vanity_url_code as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    banner: (raw.banner as string | null) ?? null,
    premiumTier: (raw.premium_tier as number) ?? 0,
    premiumSubscriptionCount: (raw.premium_subscription_count as number) ?? 0,
    preferredLocale: (raw.preferred_locale as string) ?? 'en-US',
    publicUpdatesChannelId: (raw.public_updates_channel_id as string | null) ?? null,
    nsfwLevel: (raw.nsfw_level as number) ?? 0,
    premiumProgressBarEnabled: (raw.premium_progress_bar_enabled as boolean) ?? false,
    roles: Array.isArray(raw.roles) ? (raw.roles as Record<string, unknown>[]).map(r => buildRole(r)) : [],
    emojis: (raw.emojis as Emoji[]) ?? [],
    applicationId: (raw.application_id as string | null) ?? null,
  } as Guild
}

export function buildRole(raw: Record<string, unknown>): Role {
  return {
    id: raw.id as string,
    name: raw.name as string,
    color: (raw.color as number) ?? 0,
    hoist: (raw.hoist as boolean) ?? false,
    position: (raw.position as number) ?? 0,
    permissions: raw.permissions as string,
    managed: (raw.managed as boolean) ?? false,
    mentionable: (raw.mentionable as boolean) ?? false,
    icon: (raw.icon as string | null) ?? null,
    unicodeEmoji: (raw.unicode_emoji as string | null) ?? null,
  } as Role
}

export function buildMember(raw: Record<string, unknown>, guildId: string, cache: TongueStore): Member {

  let userObj: User | undefined
  
  if (raw.user) {
    const user = buildUser(raw.user as Record<string, unknown>)
    cache.users.set(user.id, user)
    userObj = user
  }

  return {
    ...(userObj ? { user: userObj } : {}),
    nick: (raw.nick as string | null) ?? null,
    avatar: (raw.avatar as string | null) ?? null,
    roles: (raw.roles as string[]) ?? [],
    joinedAt: raw.joined_at ? Date.parse(raw.joined_at as string) : 0,
    premiumSince: raw.premium_since ? Date.parse(raw.premium_since as string) : null,
    deaf: (raw.deaf as boolean) ?? false,
    mute: (raw.mute as boolean) ?? false,
    pending: (raw.pending as boolean) ?? false,
    flags: (raw.flags as number) ?? 0,
    communicationDisabledUntil: raw.communication_disabled_until ? Date.parse(raw.communication_disabled_until as string) : null,
  } as Member
}

export function buildMessage(raw: Record<string, unknown>, cache: TongueStore, oldMessage?: Message): Message {

  const authorRaw = raw.author as Record<string, unknown> | undefined
  const author = authorRaw ? buildUser(authorRaw) : (oldMessage?.author ?? ({} as User))

  // hydrate user into cache
  if (authorRaw && author.id) {
    cache.users.set(author.id, author)
  }

  const msgId = (raw.id as string) ?? oldMessage?.id
  const channelId = (raw.channel_id as string) ?? oldMessage?.channelId
  const guildId = raw.guild_id ? (raw.guild_id as string) : oldMessage?.guildId

  const msg: Message = {
    id: msgId,
    channelId,
    author,
    ...(guildId ? { guildId } : {}),
    url: `https://discord.com/channels/${guildId ?? '@me'}/${channelId}/${msgId}`,
    content: (raw.content as string) ?? oldMessage?.content ?? '',
    timestamp: raw.timestamp ? Date.parse(raw.timestamp as string) : (oldMessage?.timestamp ?? Date.now()),
    editedTimestamp: raw.edited_timestamp ? Date.parse(raw.edited_timestamp as string) : oldMessage?.editedTimestamp ?? null,
    tts: (raw.tts as boolean) ?? oldMessage?.tts ?? false,
    mentionEveryone: (raw.mention_everyone as boolean) ?? oldMessage?.mentionEveryone ?? false,
    mentions: raw.mentions ? (raw.mentions as Record<string, unknown>[]).map(m => buildUser(m)) : (oldMessage?.mentions ?? []),
    mentionRoles: (raw.mention_roles as string[]) ?? oldMessage?.mentionRoles ?? [],
    attachments: (raw.attachments as import('../types/message/index.ts').Attachment[]) ?? oldMessage?.attachments ?? [],
    embeds: (raw.embeds as import('../types/message/index.ts').Embed[]) ?? oldMessage?.embeds ?? [],
    pinned: (raw.pinned as boolean) ?? oldMessage?.pinned ?? false,
    type: (raw.type as number) ?? oldMessage?.type ?? 0,
  }

  return msg
}

export function resolveChannel(channelId: string, cache: TongueStore): Channel | { id: string } {
  return cache.channels.get(channelId) ?? { id: channelId }
}

export function resolveGuild(guildId: string, cache: TongueStore): Guild | { id: string } {
  return cache.guilds.get(guildId) ?? { id: guildId }
}

export function resolveUser(userId: string, cache: TongueStore): User | { id: string } {
  return cache.users.get(userId) ?? { id: userId }
}

export function resolveRole(roleId: string, cache: TongueStore): Role | { id: string } {
  return cache.roles.get(roleId) ?? { id: roleId }
}