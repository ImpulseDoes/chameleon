import { BitField, type BitFieldResolvable } from '../utils/bitfield.js'
import { DISCORD_PERMISSIONS } from './types.js'
import type { Role } from './guild/index.js'
import type { Overwrite } from './channel/index.js'

export class PermissionsBitField extends BitField {

  public static override FLAGS: Record<string, bigint> = { ...DISCORD_PERMISSIONS }

  public static ALL = Object.values(DISCORD_PERMISSIONS).reduce((a, b) => a | b, 0n)

  public get isAdmin(): boolean {

    return this.has('ADMINISTRATOR')
  }

  public static from(bits: BitFieldResolvable): PermissionsBitField {

    return new PermissionsBitField(bits)
  }
}

/**
 * Handles Discord user flag bitfields.
 */
export class UserFlagsBitField extends BitField {

  public static override FLAGS: Record<string, bigint> = {
    STAFF: 1n << 0n,
    PARTNER: 1n << 1n,
    HYPESQUAD: 1n << 2n,
    BUG_HUNTER_LEVEL_1: 1n << 3n,
    HYPESQUAD_ONLINE_HOUSE_1: 1n << 6n,
    HYPESQUAD_ONLINE_HOUSE_2: 1n << 7n,
    HYPESQUAD_ONLINE_HOUSE_3: 1n << 8n,
    PREMIUM_EARLY_SUPPORTER: 1n << 9n,
    TEAM_PSEUDO_USER: 1n << 10n,
    BUG_HUNTER_LEVEL_2: 1n << 14n,
    VERIFIED_BOT: 1n << 16n,
    VERIFIED_DEVELOPER: 1n << 17n,
    CERTIFIED_MODERATOR: 1n << 18n,
    BOT_HTTP_INTERACTIONS: 1n << 19n,
    ACTIVE_DEVELOPER: 1n << 22n,
  }
}

/**
 * Handles Discord gateway intent bitfields.
 */
export class IntentsBitField extends BitField {

  public static override FLAGS: Record<string, bigint> = {
    Guilds: 1n << 0n,
    GuildMembers: 1n << 1n,
    GuildModeration: 1n << 2n,
    GuildEmojisAndStickers: 1n << 3n,
    GuildIntegrations: 1n << 4n,
    GuildWebhooks: 1n << 5n,
    GuildInvites: 1n << 6n,
    GuildVoiceStates: 1n << 7n,
    GuildPresences: 1n << 8n,
    GuildMessages: 1n << 9n,
    GuildMessageReactions: 1n << 10n,
    GuildMessageTyping: 1n << 11n,
    DirectMessages: 1n << 12n,
    DirectMessageReactions: 1n << 13n,
    DirectMessageTyping: 1n << 14n,
    MessageContent: 1n << 15n,
    GuildScheduledEvents: 1n << 16n,
    AutoModerationConfiguration: 1n << 20n,
    AutoModerationExecution: 1n << 21n,
    GuildMessagePolls: 1n << 24n,
    DirectMessagePolls: 1n << 25n,
  }
}

/**
 * Calculate the base permissions for a member in a guild.
 */
export function computeBasePermissions(member: { roles: string[] }, guild: { id: string, ownerId: string, roles: Role[] }): bigint {

  if (member.roles === undefined) return 0n

  const userId = (member as unknown as { user?: { id: string } }).user?.id
  
  if (userId && userId === guild.ownerId) return PermissionsBitField.ALL

  // @everyone role
  const everyoneRole = guild.roles.find(r => r.id === guild.id)
  let permissions = everyoneRole ? BigInt(everyoneRole.permissions) : 0n

  // Add permissions from all assigned roles
  for (const roleId of member.roles) {

    const role = guild.roles.find(r => r.id === roleId)
    
    if (role) permissions |= BigInt(role.permissions)
  }

  if ((permissions & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR) {
    return PermissionsBitField.ALL
  }

  return permissions
}

export function computeChannelPermissions(basePermissions: bigint, overwrites: Overwrite[], memberRoles: string[], memberId?: string): bigint {

  if ((basePermissions & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR) {

    return PermissionsBitField.ALL
  }

  let permissions = basePermissions

  let allow = 0n
  let deny = 0n

  for (const overwrite of overwrites) {

    if (overwrite.type === 0) {
      
      if (memberRoles.includes(overwrite.id) || overwrites.indexOf(overwrite) === 0) {
        
        if (overwrites.indexOf(overwrite) === 0 && !memberRoles.includes(overwrite.id)) {
          
          permissions &= ~BigInt(overwrite.deny)
          permissions |= BigInt(overwrite.allow)
        
        } else {
          
          allow |= BigInt(overwrite.allow)
          deny |= BigInt(overwrite.deny)

        }
      }
    }
  }

  permissions &= ~deny
  permissions |= allow

  if (memberId) {

    const memberOverwrite = overwrites.find(ow => ow.type === 1 && ow.id === memberId)
    
    if (memberOverwrite) {
      permissions &= ~BigInt(memberOverwrite.deny)
      permissions |= BigInt(memberOverwrite.allow)
    }
  }

  return permissions
}