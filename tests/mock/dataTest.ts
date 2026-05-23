import { buildUser, buildGuild, buildChannel, buildMember, buildRole, buildMessage } from '../../src/builders/index.ts'
import { TongueStore } from '../../src/client/store.ts'

const CLIENT_USER = {
  id: "704802632660943089",
  username: "impulsedoes",
  discriminator: "0001",
  avatar: null,
  global_name: "impulsedoes",
  bot: false,
  system: false,
  mfa_enabled: false,
  locale: "en-US",
  verified: false,
  email: null,
  premium_type: 0,
};

const TEXT_CHANNEL = {
  id: "123456789112345678",
  type: 0,
  guild_id: "619434557472505857",
  position: 0,
  permission_overwrites: [],
  name: "test-channel",
  topic: "test topic",
  nsfw: false,
  last_message_id: "123456789012345678",
  rate_limit_per_user: 0,
  parent_id: "123456789012345678",
  last_pin_timestamp: "2021-01-01T00:00:00.000Z",
};

const MESSAGE = {
  timestamp: "2021-01-01T00:00:00.000Z",
  tts: false,
  id: "123456339012345678",
  type: 0,
  content: "test message @everyone",
  channel_id: "123456789112345678",
  author: {
    id: "301655085954367490",
    username: "test",
    discriminator: "0001",
    avatar: null,
    global_name: "test",
    bot: false,
    system: false,
    mfa_enabled: false,
    locale: "en-US",
    verified: false,
    email: null,
    premium_type: 0,
  },
  edited_timestamp: "2022-01-01T00:00:00.000Z",
  mention_everyone: true,
  mentions: [],
  mention_roles: [],
  attachments: [],
  embeds: [],
  pinned: false
};

const ROLE_ADMIN = {
  id: "123452789012345678",
  name: "admin",
  color: 0,
  hoist: true,
  position: 3,
  permissions: "8",
  managed: true,
  mentionable: true,
  tags: {},
  icon: "000000000000000000000000deadbeef",
  flags: 1,
};

const MEMBER = {
  user: {
    id: "301655085954367490",
    username: "test",
    discriminator: "0001",
    avatar: null,
    bot: false,
    system: false,
    mfa_enabled: false,
    locale: "en-US",
    verified: false,
    email: null,
    premium_type: 0,
    public_flags: 0,
  },
  nick: null,
  roles: [],
  joined_at: "2021-01-01T00:00:00.000Z",
  premium_since: null,
  deaf: false,
  mute: false,
  pending: false,
  permissions: "0",
  flags: 0,
};

const GUILD = {
  id: "619434557472505857",
  name: "test-guild",
  icon: null,
  splash: null,
  discovery_splash: null,
  owner_id: "301655085954367490",
  region: "us-west",
  afk_channel_id: null,
  afk_timeout: 300,
  verification_level: 0,
  default_message_notifications: 0,
  explicit_content_filter: 0,
  roles: [],
  emojis: [],
  features: [],
  mfa_level: 0,
  application_id: null,
  system_channel_id: "123456789112345678",
  system_channel_flags: 0,
  rules_channel_id: "123456788112345679",
  member_count: 500,
  voice_states: [],
  members: [],
  channels: [],
  threads: [],
  presences: [],
  max_presences: 25000,
  max_members: 250000,
  vanity_url_code: null,
  description: null,
  banner: null,
  premium_tier: 1,
  premium_subscription_count: 9,
  preferred_locale: "en-US",
  public_updates_channel_id: null,
  max_video_channel_users: 0,
  approximate_member_count: 1,
  approximate_presence_count: 1,
  nsfw_level: 0,
  stage_instances: [],
  stickers: [],
};

const SLASH_COMMAND_INTERACTION = {
  id: "123451189012345678",
  type: 2,
  data: {
    name: "test",
    options: [],
    id: "88928343488938934",
    type: 1,
  },
  guild_id: "619434557472505857",
  channel_id: "123456789012345677",
  member: MEMBER,
  token: "test",
  version: 1,
  app_permissions: "434534",
  application_id: "123456789",
  locale: "en-US",
};

export const RAW_DATA = {
  CLIENT_USER,
  TEXT_CHANNEL,
  MESSAGE,
  ROLE_ADMIN,
  MEMBER,
  GUILD,
  SLASH_COMMAND_INTERACTION
}

const cache = new TongueStore()

export const TEST_ENTITIES = {
  USER: () => buildUser(RAW_DATA.CLIENT_USER),
  GUILD: () => buildGuild(RAW_DATA.GUILD),
  CHANNEL: () => buildChannel(RAW_DATA.TEXT_CHANNEL),
  ROLE: () => buildRole(RAW_DATA.ROLE_ADMIN),
  MEMBER: () => buildMember(RAW_DATA.MEMBER, RAW_DATA.GUILD.id, cache),
  MESSAGE: () => buildMessage(RAW_DATA.MESSAGE, cache)
}