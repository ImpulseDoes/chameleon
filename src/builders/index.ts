import type { User } from '../types/user/index.js'
import type { Channel, ThreadMember } from '../types/channel/index.js'
import type { Guild, Member, Role } from '../types/guild/index.js'
import { MessageFlag, MessageReferenceType, MessageType, type Message } from '../types/message/index.js'
import type { Emoji, Sticker } from '../types/expressions/index.js'
import type { TongueStore } from '../client/store.js'
import type { Client } from '../client/client.js'
import type { ChameleonAPIResult } from '../rest/types.js'
import { toCamelCase } from '../utils/object.js'

export * from './embed.js'
export * from './components.js'
export * from './entities.js'

function buildAttachment(raw: Record<string, unknown>): import('../types/message/index.js').Attachment {
  return {
    id: raw.id as string,
    filename: (raw.filename as string) ?? '',
    ...(raw.title !== undefined ? { title: raw.title as string } : {}),
    ...(raw.description !== undefined ? { description: raw.description as string } : {}),
    size: (raw.size as number) ?? 0,
    url: (raw.url as string) ?? '',
    proxyUrl: (raw.proxy_url as string) ?? '',
    ...(raw.content_type !== undefined ? { contentType: raw.content_type as string } : {}),
    ...(raw.height !== undefined ? { height: (raw.height as number | null) ?? null } : {}),
    ...(raw.width !== undefined ? { width: (raw.width as number | null) ?? null } : {}),
    ...(raw.placeholder !== undefined ? { placeholder: raw.placeholder as string } : {}),
    ...(raw.placeholder_version !== undefined ? { placeholderVersion: raw.placeholder_version as number } : {}),
    ...(raw.ephemeral !== undefined ? { ephemeral: raw.ephemeral as boolean } : {}),
    ...(raw.duration_secs !== undefined ? { durationSecs: raw.duration_secs as number } : {}),
    ...(raw.waveform !== undefined ? { waveform: raw.waveform as string } : {}),
    ...(raw.flags !== undefined ? { flags: raw.flags as number } : {}),
    ...(raw.clip_participants !== undefined ? { clipParticipants: (raw.clip_participants as Record<string, unknown>[]).map(user => buildUser(user)) } : {}),
    ...(raw.clip_created_at !== undefined ? { clipCreatedAt: raw.clip_created_at ? Date.parse(raw.clip_created_at as string) : 0 } : {}),
    ...(raw.application !== undefined ? { application: toCamelCase(raw.application) as import('../types/application/index.js').Application } : {})
  }
}

function buildEmbed(raw: Record<string, unknown>): import('../types/message/index.js').Embed {
  return {
    ...(raw.title !== undefined ? { title: raw.title as string } : {}),
    ...(raw.type !== undefined ? { type: raw.type as string } : {}),
    ...(raw.description !== undefined ? { description: raw.description as string } : {}),
    ...(raw.url !== undefined ? { url: raw.url as string } : {}),
    ...(raw.timestamp !== undefined ? { timestamp: raw.timestamp ? Date.parse(raw.timestamp as string) : 0 } : {}),
    ...(raw.color !== undefined ? { color: raw.color as number } : {}),
    ...(raw.footer !== undefined ? { footer: toCamelCase(raw.footer) as import('../types/message/index.js').EmbedFooter } : {}),
    ...(raw.image !== undefined ? { image: toCamelCase(raw.image) as import('../types/message/index.js').EmbedImage } : {}),
    ...(raw.thumbnail !== undefined ? { thumbnail: toCamelCase(raw.thumbnail) as import('../types/message/index.js').EmbedImage } : {}),
    ...(raw.video !== undefined ? { video: toCamelCase(raw.video) as import('../types/message/index.js').EmbedVideo } : {}),
    ...(raw.provider !== undefined ? { provider: toCamelCase(raw.provider) as import('../types/message/index.js').EmbedProvider } : {}),
    ...(raw.author !== undefined ? { author: toCamelCase(raw.author) as import('../types/message/index.js').EmbedAuthor } : {}),
    ...(raw.fields !== undefined ? { fields: toCamelCase(raw.fields) as import('../types/message/index.js').EmbedField[] } : {}),
    ...(raw.flags !== undefined ? { flags: raw.flags as number } : {})
  }
}

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
    ...(raw.verified !== undefined ? { verified: raw.verified as boolean } : {}),
    ...(raw.email !== undefined ? { email: (raw.email as string | null) ?? null } : {}),
    flags: (raw.flags as number) ?? 0,
    premiumType: (raw.premium_type as number) ?? 0,
    publicFlags: (raw.public_flags as number) ?? 0,
    ...(raw.avatar_decoration_data !== undefined ? {
      avatarDecorationData: raw.avatar_decoration_data
        ? {
            asset: ((raw.avatar_decoration_data as Record<string, unknown>).asset as string) ?? '',
            skuId: ((raw.avatar_decoration_data as Record<string, unknown>).sku_id as string) ?? ''
          }
        : null
    } : {}),
    ...(raw.collectibles !== undefined ? {
      collectibles: raw.collectibles
        ? {
            ...((raw.collectibles as Record<string, unknown>).nameplate
              ? {
                  nameplate: {
                    skuId: ((((raw.collectibles as Record<string, unknown>).nameplate as Record<string, unknown>).sku_id) as string) ?? '',
                    asset: ((((raw.collectibles as Record<string, unknown>).nameplate as Record<string, unknown>).asset) as string) ?? '',
                    label: ((((raw.collectibles as Record<string, unknown>).nameplate as Record<string, unknown>).label) as string) ?? '',
                    palette: (((((raw.collectibles as Record<string, unknown>).nameplate as Record<string, unknown>).palette) as string[]) ?? [])
                  }
                }
              : {})
          }
        : null
    } : {}),
    ...(raw.primary_guild !== undefined ? {
      primaryGuild: raw.primary_guild
        ? {
            identityGuildId: (((raw.primary_guild as Record<string, unknown>).identity_guild_id) as string | null) ?? null,
            identityEnabled: (((raw.primary_guild as Record<string, unknown>).identity_enabled) as boolean | null) ?? null,
            tag: (((raw.primary_guild as Record<string, unknown>).tag) as string | null) ?? null,
            badge: (((raw.primary_guild as Record<string, unknown>).badge) as string | null) ?? null
          }
        : null
    } : {}),
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
    ...(raw.recipients !== undefined ? { recipients: (raw.recipients as Record<string, unknown>[]).map(recipient => buildUser(recipient)) } : {}),
    ...(raw.icon !== undefined ? { icon: raw.icon as string | null } : {}),
    ...(raw.owner_id !== undefined ? { ownerId: raw.owner_id as string } : {}),
    ...(raw.application_id !== undefined ? { applicationId: raw.application_id as string } : {}),
    ...(raw.managed !== undefined ? { managed: raw.managed as boolean } : {}),
    ...(raw.last_pin_timestamp !== undefined ? { lastPinTimestamp: raw.last_pin_timestamp ? Date.parse(raw.last_pin_timestamp as string) : null } : {}),
    ...(raw.rtc_region !== undefined ? { rtcRegion: raw.rtc_region as string | null } : {}),
    ...(raw.video_quality_mode !== undefined ? { videoQualityMode: raw.video_quality_mode as number } : {}),
    ...(raw.message_count !== undefined ? { messageCount: raw.message_count as number } : {}),
    ...(raw.member_count !== undefined ? { memberCount: raw.member_count as number } : {}),
    ...(raw.thread_metadata !== undefined ? { 
      threadMetadata: {
        archived: (raw.thread_metadata as any).archived,
        autoArchiveDuration: (raw.thread_metadata as any).auto_archive_duration,
        archiveTimestamp: Date.parse((raw.thread_metadata as any).archive_timestamp),
        locked: (raw.thread_metadata as any).locked,
        invitable: (raw.thread_metadata as any).invitable,
        createTimestamp: (raw.thread_metadata as any).create_timestamp ? Date.parse((raw.thread_metadata as any).create_timestamp) : null
      }
    } : {}),
    ...(raw.member !== undefined ? { 
      member: {
        id: (raw.member as any).id,
        userId: (raw.member as any).user_id,
        joinTimestamp: Date.parse((raw.member as any).join_timestamp),
        flags: (raw.member as any).flags
      }
    } : {}),
    ...(raw.default_auto_archive_duration !== undefined ? { defaultAutoArchiveDuration: raw.default_auto_archive_duration as number } : {}),
    ...(raw.permissions !== undefined ? { permissions: raw.permissions as string } : {}),
    ...(raw.flags !== undefined ? { flags: raw.flags as number } : {}),
    ...(raw.total_message_sent !== undefined ? { totalMessageSent: raw.total_message_sent as number } : {}),
    ...(raw.available_tags !== undefined ? { 
      availableTags: (raw.available_tags as any[]).map(t => ({
        id: t.id,
        name: t.name,
        moderated: t.moderated,
        emojiId: t.emoji_id,
        emojiName: t.emoji_name
      }))
    } : {}),
    ...(raw.applied_tags !== undefined ? { appliedTags: raw.applied_tags as string[] } : {}),
    ...(raw.default_reaction_emoji !== undefined ? { 
      defaultReactionEmoji: raw.default_reaction_emoji ? {
        emojiId: (raw.default_reaction_emoji as any).emoji_id,
        emojiName: (raw.default_reaction_emoji as any).emoji_name
      } : null
    } : {}),
    ...(raw.default_thread_rate_limit_per_user !== undefined ? { defaultThreadRateLimitPerUser: raw.default_thread_rate_limit_per_user as number } : {}),
    ...(raw.default_sort_order !== undefined ? { defaultSortOrder: raw.default_sort_order as number | null } : {}),
    ...(raw.default_forum_layout !== undefined ? { defaultForumLayout: raw.default_forum_layout as number } : {}),
  } as Channel
}

export function buildGuild(raw: Record<string, unknown>): Guild {

  return {
    id: raw.id as string,
    name: raw.name as string,
    icon: (raw.icon as string | null) ?? null,
    ...(raw.icon_hash !== undefined ? { iconHash: (raw.icon_hash as string | null) ?? null } : {}),
    splash: (raw.splash as string | null) ?? null,
    discoverySplash: (raw.discovery_splash as string | null) ?? null,
    ...(raw.owner !== undefined ? { owner: (raw.owner as boolean | null) ?? null } : {}),
    ownerId: raw.owner_id as string,
    ...(raw.permissions !== undefined ? { permissions: (raw.permissions as string | null) ?? null } : {}),
    ...(raw.region !== undefined ? { region: (raw.region as string | null) ?? null } : {}),
    afkChannelId: (raw.afk_channel_id as string | null) ?? null,
    afkTimeout: (raw.afk_timeout as number) ?? 0,
    ...(raw.widget_enabled !== undefined ? { widgetEnabled: raw.widget_enabled as boolean } : {}),
    ...(raw.widget_channel_id !== undefined ? { widgetChannelId: (raw.widget_channel_id as string | null) ?? null } : {}),
    verificationLevel: (raw.verification_level as number) ?? 0,
    defaultMessageNotifications: (raw.default_message_notifications as number) ?? 0,
    explicitContentFilter: (raw.explicit_content_filter as number) ?? 0,
    features: (raw.features as string[]) ?? [],
    mfaLevel: (raw.mfa_level as number) ?? 0,
    systemChannelId: (raw.system_channel_id as string | null) ?? null,
    systemChannelFlags: (raw.system_channel_flags as number) ?? 0,
    rulesChannelId: (raw.rules_channel_id as string | null) ?? null,
    ...(raw.max_presences !== undefined ? { maxPresences: (raw.max_presences as number | null) ?? null } : {}),
    ...(raw.max_members !== undefined ? { maxMembers: raw.max_members as number } : {}),
    memberCount: (raw.member_count as number) ?? 0,
    vanityUrlCode: (raw.vanity_url_code as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    banner: (raw.banner as string | null) ?? null,
    premiumTier: (raw.premium_tier as number) ?? 0,
    premiumSubscriptionCount: (raw.premium_subscription_count as number) ?? 0,
    preferredLocale: (raw.preferred_locale as string) ?? 'en-US',
    publicUpdatesChannelId: (raw.public_updates_channel_id as string | null) ?? null,
    ...(raw.max_video_channel_users !== undefined ? { maxVideoChannelUsers: raw.max_video_channel_users as number } : {}),
    ...(raw.max_stage_video_channel_users !== undefined ? { maxStageVideoChannelUsers: raw.max_stage_video_channel_users as number } : {}),
    ...(raw.approximate_member_count !== undefined ? { approximateMemberCount: raw.approximate_member_count as number } : {}),
    ...(raw.approximate_presence_count !== undefined ? { approximatePresenceCount: raw.approximate_presence_count as number } : {}),
    ...(raw.welcome_screen !== undefined ? {
      welcomeScreen: raw.welcome_screen
        ? {
            description: (((raw.welcome_screen as Record<string, unknown>).description) as string | null) ?? null,
            welcomeChannels: ((((raw.welcome_screen as Record<string, unknown>).welcome_channels) as Record<string, unknown>[] | undefined) ?? []).map(channel => ({
              channelId: (channel.channel_id as string) ?? '',
              description: (channel.description as string) ?? '',
              emojiId: (channel.emoji_id as string | null) ?? null,
              emojiName: (channel.emoji_name as string | null) ?? null
            }))
          }
        : undefined
    } : {}),
    nsfwLevel: (raw.nsfw_level as number) ?? 0,
    ...(raw.stickers !== undefined ? {
      stickers: (raw.stickers as Record<string, unknown>[]).map(sticker => ({
        id: sticker.id as string,
        ...(sticker.pack_id !== undefined ? { packId: sticker.pack_id as string } : {}),
        name: (sticker.name as string) ?? '',
        description: (sticker.description as string | null) ?? null,
        tags: (sticker.tags as string) ?? '',
        type: (sticker.type as number) ?? 1,
        formatType: (sticker.format_type as number) ?? 1,
        ...(sticker.available !== undefined ? { available: sticker.available as boolean } : {}),
        ...(sticker.guild_id !== undefined ? { guildId: sticker.guild_id as string } : {}),
        ...(sticker.sort_value !== undefined ? { sortValue: sticker.sort_value as number } : {})
      }) as Sticker)
    } : {}),
    premiumProgressBarEnabled: (raw.premium_progress_bar_enabled as boolean) ?? false,
    ...(raw.safety_alerts_channel_id !== undefined ? { safetyAlertsChannelId: (raw.safety_alerts_channel_id as string | null) ?? null } : {}),
    ...(raw.incidents_data !== undefined ? {
      incidentsData: raw.incidents_data
        ? {
            invitesDisabledUntil: (((raw.incidents_data as Record<string, unknown>).invites_disabled_until) as string | null) ?? null,
            dmsDisabledUntil: (((raw.incidents_data as Record<string, unknown>).dms_disabled_until) as string | null) ?? null,
            ...((raw.incidents_data as Record<string, unknown>).dm_spam_detected_at !== undefined ? { dmSpamDetectedAt: (((raw.incidents_data as Record<string, unknown>).dm_spam_detected_at) as string | null) ?? null } : {}),
            ...((raw.incidents_data as Record<string, unknown>).raid_detected_at !== undefined ? { raidDetectedAt: (((raw.incidents_data as Record<string, unknown>).raid_detected_at) as string | null) ?? null } : {})
          }
        : null
    } : {}),
    roles: Array.isArray(raw.roles) ? (raw.roles as Record<string, unknown>[]).map(r => buildRole(r)) : [],
    emojis: (raw.emojis as Emoji[]) ?? [],
    applicationId: (raw.application_id as string | null) ?? null,
    large: (raw.large as boolean) ?? false,
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
    ...(raw.tags !== undefined ? {
      tags: {
        ...((raw.tags as Record<string, unknown>).bot_id !== undefined ? { botId: (raw.tags as Record<string, unknown>).bot_id as string } : {}),
        ...((raw.tags as Record<string, unknown>).integration_id !== undefined ? { integrationId: (raw.tags as Record<string, unknown>).integration_id as string } : {}),
        ...((raw.tags as Record<string, unknown>).premium_subscriber !== undefined ? { premiumSubscriber: null } : {}),
        ...((raw.tags as Record<string, unknown>).subscription_listing_id !== undefined ? { subscriptionListingId: (raw.tags as Record<string, unknown>).subscription_listing_id as string } : {}),
        ...((raw.tags as Record<string, unknown>).available_for_purchase !== undefined ? { availableForPurchase: null } : {}),
        ...((raw.tags as Record<string, unknown>).guild_connections !== undefined ? { guildConnections: null } : {})
      }
    } : {}),
    flags: (raw.flags as number) ?? 0,
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
    ...(raw.banner !== undefined ? { banner: (raw.banner as string | null) ?? null } : {}),
    roles: (raw.roles as string[]) ?? [],
    joinedAt: raw.joined_at ? Date.parse(raw.joined_at as string) : null,
    premiumSince: raw.premium_since ? Date.parse(raw.premium_since as string) : null,
    deaf: (raw.deaf as boolean) ?? false,
    mute: (raw.mute as boolean) ?? false,
    pending: (raw.pending as boolean) ?? false,
    ...(raw.permissions !== undefined ? { permissions: raw.permissions as string } : {}),
    flags: (raw.flags as number) ?? 0,
    communicationDisabledUntil: raw.communication_disabled_until ? Date.parse(raw.communication_disabled_until as string) : null,
    ...(raw.avatar_decoration_data !== undefined ? { avatarDecorationData: buildUser({ avatar_decoration_data: raw.avatar_decoration_data }).avatarDecorationData ?? null } : {}),
    ...(raw.collectibles !== undefined ? { collectibles: buildUser({ collectibles: raw.collectibles }).collectibles ?? null } : {}),
  } as Member
}

export function buildThreadMember(raw: Record<string, unknown>, guildId?: string, cache?: TongueStore): ThreadMember {

  return {
    ...(raw.id !== undefined ? { id: raw.id as string } : {}),
    ...(raw.user_id !== undefined ? { userId: raw.user_id as string } : {}),
    joinTimestamp: raw.join_timestamp ? Date.parse(raw.join_timestamp as string) : 0,
    flags: (raw.flags as number) ?? 0,
    ...(raw.member && guildId && cache ? { member: buildMember(raw.member as Record<string, unknown>, guildId, cache) } : {}),
    ...(raw.presence !== undefined ? { presence: raw.presence as Record<string, unknown> } : {})
  }
}

export function buildMessage(raw: Record<string, unknown>, cache: TongueStore, oldMessage?: Message): Message {

  const authorRaw = raw.author as Record<string, unknown> | undefined
  const author = authorRaw ? buildUser(authorRaw) : (oldMessage?.author ?? ({} as User))

  if (authorRaw && author.id) cache.users.set(author.id, author)

  const msgId = (raw.id as string) ?? oldMessage?.id
  const channelId = (raw.channel_id as string) ?? oldMessage?.channelId
  const guildId = raw.guild_id ? (raw.guild_id as string) : oldMessage?.guildId
  const type = (raw.type as number) ?? oldMessage?.type ?? 0
  const flags = (raw.flags as number | undefined) ?? oldMessage?.flags
  const editedTimestamp = raw.edited_timestamp ? Date.parse(raw.edited_timestamp as string) : oldMessage?.editedTimestamp ?? null
  const attachments = raw.attachments
    ? (raw.attachments as Record<string, unknown>[]).map(attachment => buildAttachment(attachment))
    : oldMessage?.attachments ?? []
  const embeds = raw.embeds
    ? (raw.embeds as Record<string, unknown>[]).map(embed => buildEmbed(embed))
    : oldMessage?.embeds ?? []
  const components = raw.components ? toCamelCase(raw.components) as import('../types/components/index.ts').MessageComponent[] : oldMessage?.components
  const stickerItems = raw.sticker_items ? toCamelCase(raw.sticker_items) as import('../types/expressions/index.ts').StickerItem[] : oldMessage?.stickerItems
  const stickers = raw.stickers ? toCamelCase(raw.stickers) as import('../types/expressions/index.ts').Sticker[] : oldMessage?.stickers
  const poll = raw.poll ? toCamelCase(raw.poll) as import('../types/message/index.ts').Poll : oldMessage?.poll
  const reactions = raw.reactions 
    ? (raw.reactions as any[]).map(r => ({
        count: r.count,
        countDetails: r.count_details ? { burst: r.count_details.burst, normal: r.count_details.normal } : { burst: 0, normal: r.count },
        me: r.me ?? false,
        meBurst: r.me_burst ?? false,
        emoji: r.emoji,
        burstColors: r.burst_colors ?? []
      }))
    : oldMessage?.reactions ?? []

  const messageReference = raw.message_reference ? toCamelCase(raw.message_reference) as import('../types/message/index.ts').MessageReference : oldMessage?.messageReference
  const referencedMessage = (raw.referenced_message as Message | null | undefined) ?? oldMessage?.referencedMessage
  const interactionMetadata = raw.interaction_metadata ? toCamelCase(raw.interaction_metadata) as import('../types/message/index.ts').MessageInteractionMetadata : oldMessage?.interactionMetadata
  const interaction = raw.interaction ? toCamelCase(raw.interaction) as import('../types/interaction/index.ts').MessageInteraction : oldMessage?.interaction
  const thread = raw.thread ? buildChannel(raw.thread as Record<string, unknown>) : oldMessage?.thread
  const mentionEveryone = (raw.mention_everyone as boolean) ?? oldMessage?.mentionEveryone ?? false
  const tts = (raw.tts as boolean) ?? oldMessage?.tts ?? false
  const pinned = (raw.pinned as boolean) ?? oldMessage?.pinned ?? false
  const webhookId = (raw.webhook_id as string | undefined) ?? oldMessage?.webhookId
  const content = (raw.content as string) ?? oldMessage?.content ?? ''
  const hasVoiceMessage = Boolean((flags ?? 0) & MessageFlag.IS_VOICE_MESSAGE)
  const hasForward = Boolean(
    ((messageReference?.type ?? 0) === MessageReferenceType.FORWARD) || 
    ((raw.message_snapshots as unknown[] | undefined) ?? oldMessage?.messageSnapshots ?? []).length > 0 || 
    ((flags ?? 0) & MessageFlag.HAS_SNAPSHOT)
  )

  const msg: Message = {
    id: msgId,
    channelId,
    author,
    ...(guildId ? { guildId } : {}),
    url: `https://discord.com/channels/${guildId ?? '@me'}/${channelId}/${msgId}`,
    content,
    timestamp: raw.timestamp ? Date.parse(raw.timestamp as string) : (oldMessage?.timestamp ?? Date.now()),
    editedTimestamp,
    tts,
    mentionEveryone,
    mentions: raw.mentions ? (raw.mentions as Record<string, unknown>[]).map(m => buildUser(m)) : (oldMessage?.mentions ?? []),
    mentionRoles: (raw.mention_roles as string[]) ?? oldMessage?.mentionRoles ?? [],
    ...(raw.mention_channels !== undefined ? { mentionChannels: toCamelCase(raw.mention_channels) as import('../types/message/index.ts').ChannelMention[] } : oldMessage?.mentionChannels ? { mentionChannels: oldMessage.mentionChannels } : {}),
    attachments,
    embeds,
    ...(raw.nonce !== undefined ? { nonce: raw.nonce as string | number } : oldMessage?.nonce !== undefined ? { nonce: oldMessage.nonce } : {}),
    pinned,
    type,
    ...(raw.member && guildId ? { member: buildMember(raw.member as Record<string, unknown>, guildId, cache) } : oldMessage?.member ? { member: oldMessage.member } : {}),
    ...(raw.activity !== undefined ? { activity: toCamelCase(raw.activity) as import('../types/message/index.ts').MessageActivity } : oldMessage?.activity ? { activity: oldMessage.activity } : {}),
    ...(raw.application !== undefined ? { application: toCamelCase(raw.application) as Partial<import('../types/application/index.js').Application> } : oldMessage?.application ? { application: oldMessage.application } : {}),
    ...(raw.application_id !== undefined ? { applicationId: raw.application_id as string } : oldMessage?.applicationId ? { applicationId: oldMessage.applicationId } : {}),
    ...(webhookId ? { webhookId } : {}),
    ...(flags !== undefined ? { flags } : {}),
    ...(messageReference ? { messageReference } : {}),
    ...(raw.message_snapshots ? { messageSnapshots: raw.message_snapshots as import('../types/message/index.ts').MessageSnapshot[] } : oldMessage?.messageSnapshots ? { messageSnapshots: oldMessage.messageSnapshots } : {}),
    ...(referencedMessage !== undefined ? { referencedMessage } : {}),
    ...(interactionMetadata ? { interactionMetadata } : {}),
    ...(interaction ? { interaction } : {}),
    ...(thread ? { thread } : {}),
    ...(components ? { components } : {}),
    ...(stickerItems ? { stickerItems } : {}),
    ...(stickers ? { stickers } : {}),
    ...(poll ? { poll } : {}),
    ...(reactions.length > 0 ? { reactions } : {}),
    ...(raw.position !== undefined ? { position: raw.position as number } : oldMessage?.position !== undefined ? { position: oldMessage.position } : {}),
    ...(raw.role_subscription_data !== undefined ? { roleSubscriptionData: toCamelCase(raw.role_subscription_data) as import('../types/message/index.ts').RoleSubscriptionData } : oldMessage?.roleSubscriptionData ? { roleSubscriptionData: oldMessage.roleSubscriptionData } : {}),
    ...(raw.resolved !== undefined ? { resolved: toCamelCase(raw.resolved) as import('../types/interaction/index.ts').ResolvedData } : oldMessage?.resolved ? { resolved: oldMessage.resolved } : {}),
    ...(raw.call ? { call: raw.call as import('../types/message/index.ts').MessageCall } : oldMessage?.call ? { call: oldMessage.call } : {}),
    ...(raw.shared_client_theme !== undefined ? { sharedClientTheme: toCamelCase(raw.shared_client_theme) as import('../types/message/index.ts').SharedClientTheme } : oldMessage?.sharedClientTheme ? { sharedClientTheme: oldMessage.sharedClientTheme } : {}),
    has: {
      attachments: attachments.length > 0 && !hasVoiceMessage,
      components: (components ?? []).length > 0,
      edited: editedTimestamp !== null,
      embeds: embeds.length > 0,
      forwarded: hasForward,
      interaction: Boolean(interactionMetadata || interaction),
      mentionHere: mentionEveryone && content.includes('@here'),
      mentionEveryone,
      pinned,
      poll: Boolean(poll),
      reply: Boolean(messageReference || referencedMessage || type === MessageType.REPLY),
      stickers: (stickerItems ?? stickers ?? []).length > 0,
      system: {
        any: type !== MessageType.DEFAULT && type !== MessageType.REPLY,
        booster: type >= MessageType.GUILD_BOOST && type <= MessageType.GUILD_BOOST_TIER_3,
        call: type === MessageType.CALL,
        pinned: type === MessageType.CHANNEL_PINNED_MESSAGE,
        thread: type === MessageType.THREAD_STARTER_MESSAGE,
        welcome: type === MessageType.USER_JOIN,
      },
      thread: Boolean(thread),
      tts,
      voiceMessage: hasVoiceMessage,
      webhook: Boolean(webhookId),
    },
  }

  return msg
}

export function resolveChannel(channelId: string, client: Client): Channel | { id: string, fetch: () => Promise<ChameleonAPIResult<Channel>> } {
  return client.cache.channels.get(channelId) ?? { id: channelId, fetch: () => client.channels.fetch(channelId) }
}

export function resolveGuild(guildId: string, client: Client): Guild | { id: string, fetch: () => Promise<ChameleonAPIResult<Guild>> } {
  return client.cache.guilds.get(guildId) ?? { id: guildId, fetch: () => client.guilds.fetch(guildId) }
}

export function resolveUser(userId: string, client: Client): User | { id: string, fetch: () => Promise<ChameleonAPIResult<User>> } {
  return client.cache.users.get(userId) ?? { id: userId, fetch: () => client.users.fetch(userId) }
}

export function resolveRole(roleId: string, client: Client, guildId?: string): Role | { id: string, fetch?: () => Promise<ChameleonAPIResult<Role>> } {
  
  const stub: { id: string, fetch?: () => Promise<ChameleonAPIResult<Role>> } = { id: roleId }
  if (guildId) stub.fetch = () => client.guilds.roles(guildId).fetch(roleId)

  return client.cache.roles.get(roleId) ?? stub
}