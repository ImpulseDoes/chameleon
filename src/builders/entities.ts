import type { StageInstance } from '../types/stage/index.js'
import type { GuildScheduledEvent } from '../types/scheduled/index.js'
import type { AutoModerationRule, AutoModerationAction, AutoModerationActionMetadata, AutoModerationTriggerMetadata } from '../types/automod/index.js'
import type { Integration } from '../types/integration/index.js'
import type { Emoji, Sticker, StickerItem } from '../types/expressions/index.js'
import type { Voice } from '../types/voice/index.js'
import type { Entitlement } from '../types/entitlement/index.js'
import type { Interaction, InteractionData, ApplicationCommandData, MessageComponentData, ModalSubmitData, ResolvedData, ApplicationCommandInteractionDataOption } from '../types/interaction/index.js'
import type { User } from '../types/user/index.js'
import type { Member, Role } from '../types/guild/index.js'
import type { Invite } from '../types/invite/index.js'
import type { SoundboardSound } from '../types/soundboard/index.js'
import type { Subscription } from '../types/subscription/index.js'
import type { AuditLogEntry } from '../types/audit/index.js'
import type { Webhook } from '../types/webhook/index.js'
import type { TongueStore } from '../client/store.js'
import { buildUser, buildMember, buildChannel, buildGuild } from './index.js'
import { toCamelCase } from '../utils/object.js'

export function buildStageInstance(raw: Record<string, unknown>): StageInstance {

  return {
    id: raw.id as string,
    guildId: (raw.guild_id as string) ?? '',
    channelId: (raw.channel_id as string) ?? '',
    topic: (raw.topic as string) ?? '',
    privacyLevel: (raw.privacy_level as number) ?? 2,
    discoverableDisabled: (raw.discoverable_disabled as boolean) ?? false,
    guildScheduledEventId: (raw.guild_scheduled_event_id as string | null) ?? null,
  }
}

export function buildScheduledEvent(raw: Record<string, unknown>): GuildScheduledEvent {

  let creator: User | undefined

  if (raw.creator) {
    creator = buildUser(raw.creator as Record<string, unknown>)
  }

  return {
    id: raw.id as string,
    guildId: (raw.guild_id as string) ?? '',
    channelId: (raw.channel_id as string | null) ?? null,
    creatorId: (raw.creator_id as string | null) ?? null,
    name: (raw.name as string) ?? '',
    description: (raw.description as string | null) ?? null,
    scheduledStartTime: raw.scheduled_start_time ? Date.parse(raw.scheduled_start_time as string) : 0,
    scheduledEndTime: raw.scheduled_end_time ? Date.parse(raw.scheduled_end_time as string) : null,
    privacyLevel: (raw.privacy_level as number) ?? 2,
    status: (raw.status as number) ?? 1,
    entityType: (raw.entity_type as number) ?? 1,
    entityId: (raw.entity_id as string | null) ?? null,
    entityMetadata: raw.entity_metadata
      ? { ...((raw.entity_metadata as Record<string, unknown>).location !== undefined ? { location: (raw.entity_metadata as Record<string, unknown>).location as string } : {}) }
      : null,
    ...(creator ? { creator } : {}),
    ...(raw.user_count !== undefined ? { userCount: raw.user_count as number } : {}),
    ...(raw.image !== undefined ? { image: raw.image as string | null } : {}),
  }
}

function buildAutoModActionMetadata(raw: Record<string, unknown>): AutoModerationActionMetadata {

  return {
    ...(raw.channel_id !== undefined ? { channelId: raw.channel_id as string } : {}),
    ...(raw.duration_seconds !== undefined ? { durationSeconds: raw.duration_seconds as number } : {}),
    ...(raw.custom_message !== undefined ? { customMessage: raw.custom_message as string } : {}),
  }
}

function buildAutoModAction(raw: Record<string, unknown>): AutoModerationAction {

  return {
    type: raw.type as number,
    ...(raw.metadata ? { metadata: buildAutoModActionMetadata(raw.metadata as Record<string, unknown>) } : {}),
  }
}

function buildAutoModTriggerMetadata(raw: Record<string, unknown>): AutoModerationTriggerMetadata {

  return {
    ...(raw.keyword_filter !== undefined ? { keywordFilter: raw.keyword_filter as string[] } : {}),
    ...(raw.regex_patterns !== undefined ? { regexPatterns: raw.regex_patterns as string[] } : {}),
    ...(raw.presets !== undefined ? { presets: raw.presets as number[] } : {}),
    ...(raw.allow_list !== undefined ? { allowList: raw.allow_list as string[] } : {}),
    ...(raw.mention_total_limit !== undefined ? { mentionTotalLimit: raw.mention_total_limit as number } : {}),
    ...(raw.mention_raid_protection_enabled !== undefined ? { mentionRaidProtectionEnabled: raw.mention_raid_protection_enabled as boolean } : {}),
  }
}

export function buildAutoModRule(raw: Record<string, unknown>): AutoModerationRule {

  return {
    id: raw.id as string,
    guildId: (raw.guild_id as string) ?? '',
    name: (raw.name as string) ?? '',
    creatorId: (raw.creator_id as string) ?? '',
    eventType: (raw.event_type as number) ?? 1,
    triggerType: (raw.trigger_type as number) ?? 1,
    triggerMetadata: raw.trigger_metadata
      ? buildAutoModTriggerMetadata(raw.trigger_metadata as Record<string, unknown>)
      : {},
    actions: Array.isArray(raw.actions)
      ? (raw.actions as Record<string, unknown>[]).map(a => buildAutoModAction(a))
      : [],
    enabled: (raw.enabled as boolean) ?? false,
    exemptRoles: (raw.exempt_roles as string[]) ?? [],
    exemptChannels: (raw.exempt_channels as string[]) ?? [],
  }
}

export function buildIntegration(raw: Record<string, unknown>): Integration {

  let user: User | undefined

  if (raw.user) {
    user = buildUser(raw.user as Record<string, unknown>)
  }

  return {
    id: raw.id as string,
    name: (raw.name as string) ?? '',
    type: (raw.type as string) ?? '',
    enabled: (raw.enabled as boolean) ?? false,
    ...(raw.syncing !== undefined ? { syncing: raw.syncing as boolean } : {}),
    ...(raw.role_id !== undefined ? { roleId: raw.role_id as string } : {}),
    ...(raw.enable_emoticons !== undefined ? { enableEmoticons: raw.enable_emoticons as boolean } : {}),
    ...(raw.expire_behavior !== undefined ? { expireBehavior: raw.expire_behavior as number } : {}),
    ...(raw.expire_grace_period !== undefined ? { expireGracePeriod: raw.expire_grace_period as number } : {}),
    ...(user ? { user } : {}),
    account: raw.account
      ? { id: (raw.account as Record<string, unknown>).id as string, name: (raw.account as Record<string, unknown>).name as string }
      : { id: '', name: '' },
    ...(raw.synced_at ? { syncedAt: Date.parse(raw.synced_at as string) } : {}),
    ...(raw.subscriber_count !== undefined ? { subscriberCount: raw.subscriber_count as number } : {}),
    ...(raw.revoked !== undefined ? { revoked: raw.revoked as boolean } : {}),
    ...(raw.application !== undefined ? { application: raw.application as import('../types/application/index.js').Application } : {}),
    ...(raw.scopes !== undefined ? { scopes: raw.scopes as string[] } : {}),
  }
}

export function buildEmoji(raw: Record<string, unknown>): Emoji {

  let user: User | undefined

  if (raw.user) {
    user = buildUser(raw.user as Record<string, unknown>)
  }

  return {
    id: (raw.id as string | null) ?? null,
    name: (raw.name as string | null) ?? null,
    ...(raw.roles !== undefined ? { roles: raw.roles as string[] } : {}),
    ...(user ? { user } : {}),
    ...(raw.require_colons !== undefined ? { requireColons: raw.require_colons as boolean } : {}),
    ...(raw.managed !== undefined ? { managed: raw.managed as boolean } : {}),
    ...(raw.animated !== undefined ? { animated: raw.animated as boolean } : {}),
    ...(raw.available !== undefined ? { available: raw.available as boolean } : {}),
  }
}

export function buildSticker(raw: Record<string, unknown>): Sticker {

  let user: User | undefined

  if (raw.user) {
    user = buildUser(raw.user as Record<string, unknown>)
  }

  return {
    id: raw.id as string,
    ...(raw.pack_id !== undefined ? { packId: raw.pack_id as string } : {}),
    name: (raw.name as string) ?? '',
    description: (raw.description as string | null) ?? null,
    tags: (raw.tags as string) ?? '',
    type: (raw.type as number) ?? 1,
    formatType: (raw.format_type as number) ?? 1,
    ...(raw.available !== undefined ? { available: raw.available as boolean } : {}),
    ...(raw.guild_id !== undefined ? { guildId: raw.guild_id as string } : {}),
    ...(user ? { user } : {}),
    ...(raw.sort_value !== undefined ? { sortValue: raw.sort_value as number } : {}),
  }
}

export function buildStickerItem(raw: Record<string, unknown>): StickerItem {

  return {
    id: raw.id as string,
    name: (raw.name as string) ?? '',
    formatType: (raw.format_type as number) ?? 1,
  }
}

export function buildVoiceState(raw: Record<string, unknown>, cache?: TongueStore): Voice {

  let member: Member | undefined

  if (raw.member && cache && raw.guild_id) {
    member = buildMember(raw.member as Record<string, unknown>, raw.guild_id as string, cache)
  }

  return {
    ...(raw.guild_id !== undefined ? { guildId: raw.guild_id as string } : {}),
    channelId: (raw.channel_id as string) ?? '',
    userId: (raw.user_id as string) ?? '',
    ...(member ? { member } : {}),
    sessionId: (raw.session_id as string) ?? '',
    deaf: (raw.deaf as boolean) ?? false,
    mute: (raw.mute as boolean) ?? false,
    selfDeaf: (raw.self_deaf as boolean) ?? false,
    selfMute: (raw.self_mute as boolean) ?? false,
    selfStream: (raw.self_stream as boolean) ?? false,
    selfVideo: (raw.self_video as boolean) ?? false,
    suppress: (raw.suppress as boolean) ?? false,
    requestToSpeakTimestamp: raw.request_to_speak_timestamp
      ? Date.parse(raw.request_to_speak_timestamp as string)
      : null,
  }
}

export function buildEntitlement(raw: Record<string, unknown>): Entitlement {

  return {
    id: raw.id as string,
    skuId: (raw.sku_id as string) ?? '',
    applicationId: (raw.application_id as string) ?? '',
    ...(raw.user_id !== undefined ? { userId: raw.user_id as string } : {}),
    type: (raw.type as number) ?? 1,
    deleted: (raw.deleted as boolean) ?? false,
    ...(raw.starts_at !== undefined ? { startsAt: raw.starts_at ? Date.parse(raw.starts_at as string) : null } : {}),
    ...(raw.ends_at !== undefined ? { endsAt: raw.ends_at ? Date.parse(raw.ends_at as string) : null } : {}),
    ...(raw.guild_id !== undefined ? { guildId: raw.guild_id as string } : {}),
    ...(raw.consumed !== undefined ? { consumed: raw.consumed as boolean } : {}),
  }
}

function buildInteractionUser(raw: Record<string, unknown>, cache?: TongueStore): { user?: User, member?: Member } {

  let user: User | undefined
  let member: Member | undefined

  if (raw.member && raw.guild_id) {
    const memberRaw = raw.member as Record<string, unknown>

    if (cache) {
      member = buildMember(memberRaw, raw.guild_id as string, cache)
    }

    if (memberRaw.user) {
      user = buildUser(memberRaw.user as Record<string, unknown>)
    }
  }

  if (!user && raw.user) {
    user = buildUser(raw.user as Record<string, unknown>)
  }

  return {
    ...(user ? { user } : {}),
    ...(member ? { member } : {}),
  }
}

function buildApplicationCommandData(raw: Record<string, unknown>): ApplicationCommandData {
  return {
    ...(raw.id !== undefined ? { id: raw.id as string } : {}),
    ...(raw.name !== undefined ? { name: raw.name as string } : {}),
    ...(raw.type !== undefined ? { type: raw.type as number } : {}),
    ...(raw.resolved !== undefined ? { resolved: raw.resolved as ResolvedData } : {}),
    ...(raw.options !== undefined ? { options: raw.options as ApplicationCommandInteractionDataOption[] } : {}),
    ...(raw.guild_id !== undefined ? { guildId: raw.guild_id as string } : {}),
    ...(raw.target_id !== undefined ? { targetId: raw.target_id as string } : {}),
  } as ApplicationCommandData
}

function buildMessageComponentData(raw: Record<string, unknown>): MessageComponentData {
  return {
    customId: (raw.custom_id as string) ?? '',
    componentType: (raw.component_type as number) ?? 0,
    ...(raw.values !== undefined ? { values: raw.values as string[] } : {}),
    ...(raw.resolved !== undefined ? { resolved: raw.resolved as ResolvedData } : {}),
  }
}

function buildModalSubmitData(raw: Record<string, unknown>): ModalSubmitData {
  return {
    customId: (raw.custom_id as string) ?? '',
    components: (raw.components as import('../types/components/index.js').MessageComponent[]) ?? [],
  }
}

function buildInteractionData(raw: Record<string, unknown>): InteractionData {
  
  if (raw.components !== undefined && raw.custom_id !== undefined) {
    return buildModalSubmitData(raw)
  }

  if (raw.custom_id !== undefined || raw.component_type !== undefined) {
    return buildMessageComponentData(raw)
  }

  if (raw.name !== undefined || raw.options !== undefined || raw.resolved !== undefined) {
    return buildApplicationCommandData(raw)
  }

  return raw as unknown as InteractionData
}

export function buildInteraction(raw: Record<string, unknown>, cache?: TongueStore): Interaction {

  const { user, member } = buildInteractionUser(raw, cache)
  const data = raw.data ? buildInteractionData(raw.data as Record<string, unknown>) : undefined

  return {
    id: raw.id as string,
    applicationId: (raw.application_id as string) ?? '',
    type: (raw.type as number) ?? 1,
    ...(data ? { data } : {}),
    ...(raw.guild_id !== undefined ? { guildId: raw.guild_id as string } : {}),
    ...(raw.channel_id !== undefined ? { channelId: raw.channel_id as string } : {}),
    ...(member ? { member } : {}),
    ...(user ? { user } : {}),
    token: (raw.token as string) ?? '',
    version: (raw.version as number) ?? 1,
    ...(raw.message !== undefined ? { message: raw.message as import('../types/message/index.js').Message } : {}),
    ...(raw.app_permissions !== undefined ? { appPermissions: raw.app_permissions as string } : {}),
    ...(raw.locale !== undefined ? { locale: raw.locale as string } : {}),
    ...(raw.guild_locale !== undefined ? { guildLocale: raw.guild_locale as string } : {}),
    entitlements: Array.isArray(raw.entitlements)
      ? (raw.entitlements as Record<string, unknown>[]).map(e => buildEntitlement(e))
      : [],
    authorizingIntegrationOwners: (raw.authorizing_integration_owners as Record<string, string>) ?? {},
    context: raw.context as number,
    raw,
  }
}

export function buildInvite(raw: Record<string, unknown>): Invite {

  let inviter: User | undefined
  let targetUser: User | undefined

  if (raw.inviter) {
    inviter = buildUser(raw.inviter as Record<string, unknown>)
  }

  if (raw.target_user) {
    targetUser = buildUser(raw.target_user as Record<string, unknown>)
  }

  return {
    type: (raw.type as number) ?? 0,
    code: raw.code as string,
    ...(raw.guild ? { guild: buildGuild(raw.guild as Record<string, unknown>) } : {}),
    channel: raw.channel ? buildChannel(raw.channel as Record<string, unknown>) : null,
    ...(inviter ? { inviter } : {}),
    ...(raw.target_type !== undefined ? { targetType: raw.target_type as number } : {}),
    ...(targetUser ? { targetUser } : {}),
    ...(raw.target_application !== undefined ? { targetApplication: raw.target_application as import('../types/application/index.js').Application } : {}),
    ...(raw.approximate_presence_count !== undefined ? { approximatePresenceCount: raw.approximate_presence_count as number } : {}),
    ...(raw.approximate_member_count !== undefined ? { approximateMemberCount: raw.approximate_member_count as number } : {}),
    expiresAt: raw.expires_at ? Date.parse(raw.expires_at as string) : null,
    ...(raw.guild_scheduled_event !== undefined ? { guildScheduledEvent: buildScheduledEvent(raw.guild_scheduled_event as Record<string, unknown>) } : {}),
    ...(raw.flags !== undefined ? { flags: raw.flags as number } : {}),
    ...(raw.roles !== undefined ? { roles: raw.roles as Role[] } : {}),
    ...(raw.uses !== undefined ? { uses: raw.uses as number } : {}),
    ...(raw.max_uses !== undefined ? { maxUses: raw.max_uses as number } : {}),
    ...(raw.max_age !== undefined ? { maxAge: raw.max_age as number } : {}),
    ...(raw.temporary !== undefined ? { temporary: raw.temporary as boolean } : {}),
    ...(raw.created_at !== undefined ? { createdAt: raw.created_at ? Date.parse(raw.created_at as string) : 0 } : {}),
  }
}

export function buildSoundboardSound(raw: Record<string, unknown>): SoundboardSound {

  let user: User | undefined

  if (raw.user) {
    user = buildUser(raw.user as Record<string, unknown>)
  }

  return {
    name: (raw.name as string) ?? '',
    soundId: (raw.sound_id as string) ?? '',
    volume: (raw.volume as number) ?? 1,
    emojiId: (raw.emoji_id as string | null) ?? null,
    emojiName: (raw.emoji_name as string | null) ?? null,
    ...(raw.guild_id !== undefined ? { guildId: raw.guild_id as string } : {}),
    available: (raw.available as boolean) ?? false,
    ...(user ? { user } : {})
  }
}

export function buildSubscription(raw: Record<string, unknown>): Subscription {

  return {
    id: raw.id as string,
    userId: (raw.user_id as string) ?? '',
    skuIds: (raw.sku_ids as string[]) ?? [],
    entitlementIds: (raw.entitlement_ids as string[]) ?? [],
    renewalSkuIds: (raw.renewal_sku_ids as string[] | null) ?? null,
    currentPeriodStart: raw.current_period_start ? Date.parse(raw.current_period_start as string) : 0,
    currentPeriodEnd: raw.current_period_end ? Date.parse(raw.current_period_end as string) : 0,
    status: (raw.status as number) ?? 0,
    canceledAt: raw.canceled_at ? Date.parse(raw.canceled_at as string) : null,
    ...(raw.country !== undefined ? { country: raw.country as string } : {})
  }
}

export function buildAuditLogEntry(raw: Record<string, unknown>): AuditLogEntry {
  return toCamelCase(raw) as AuditLogEntry
}

export function buildWebhook(raw: Record<string, unknown>): Webhook {

  let user: User | undefined
  if (raw.user) {
    user = buildUser(raw.user as Record<string, unknown>)
  }

  return {
    id: raw.id as string,
    type: (raw.type as number) ?? 1,
    ...(raw.guild_id !== undefined ? { guildId: raw.guild_id as string } : {}),
    ...(raw.channel_id !== undefined ? { channelId: raw.channel_id as string | null } : {}),
    ...(user ? { user } : {}),
    name: (raw.name as string | null) ?? null,
    avatar: (raw.avatar as string | null) ?? null,
    ...(raw.token !== undefined ? { token: raw.token as string } : {}),
    applicationId: (raw.application_id as string | null) ?? null,
    ...(raw.source_guild ? { sourceGuild: buildGuild(raw.source_guild as Record<string, unknown>) } : {}),
    ...(raw.source_channel ? { sourceChannel: buildChannel(raw.source_channel as Record<string, unknown>) } : {}),
    ...(raw.url !== undefined ? { url: raw.url as string } : {}),
  }
}