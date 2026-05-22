import type { GuildScheduledEvent } from '../scheduled/index.js'
import type { Integration } from '../integration/index.js'
import type { Channel } from '../channel/index.js'
import type { User } from '../user/index.js'
import type { Webhook } from '../webhook/index.js'
import { AUDIT_LOG_EVENT_TYPES } from '../types.js'
import type { ApplicationCommand } from '../application/index.js'
import type { AutoModerationRule } from '../automod/index.js'

export interface AuditLogChange {
  newValue?: unknown
  oldValue?: unknown
  key: string
}

export interface OptionalAuditEntryInfo {
  applicationId?: string
  autoModerationRuleName?: string
  autoModerationRuleTriggerType?: string
  channelId?: string
  count?: string
  deleteMemberDays?: string
  id?: string
  membersRemoved?: string
  messageId?: string
  roleName?: string
  type?: string
  integrationType?: string
  status?: string
}

export interface AuditLogEntry {
  targetId: string | null
  changes?: AuditLogChange[]
  userId: string | null
  id: string
  actionType: (typeof AUDIT_LOG_EVENT_TYPES)[keyof typeof AUDIT_LOG_EVENT_TYPES]
  options?: OptionalAuditEntryInfo
  reason?: string
}

export interface AuditLog {
  applicationCommands: Partial<ApplicationCommand>[]
  auditLogEntries: AuditLogEntry[]
  autoModerationRules: AutoModerationRule[]
  guildScheduledEvents: GuildScheduledEvent[]
  integrations: Partial<Integration>[]
  threads: Channel[]
  users: User[]
  webhooks: Webhook[]
}