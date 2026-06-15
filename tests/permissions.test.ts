import { describe, it, expect } from 'vitest'
import { computeBasePermissions, computeChannelPermissions } from '../src/types/permissions.ts'
import { DISCORD_PERMISSIONS } from '../src/types/types.ts'

describe('Permission helpers', () => {

  it('should grant full permissions to guild owner', () => {

    const guild = {
      id: 'g1',
      ownerId: 'owner',
      roles: [
        { id: 'g1', permissions: '0' }
      ]
    } as unknown as import('../src/types/guild/index.ts').Guild

    const member = {
      user: { id: 'owner' },
      roles: []
    } as unknown as import('../src/types/guild/index.ts').Member

    expect(computeBasePermissions(member, guild)).toBeGreaterThan(0n)
  })

  it('should apply overwrites on top of base permissions', () => {

    const guild = {
      id: 'g1',
      ownerId: 'owner',
      roles: [
        { id: 'g1', permissions: '0' },
        { id: 'r1', permissions: DISCORD_PERMISSIONS.VIEW_CHANNEL.toString() }
      ]
    } as unknown as import('../src/types/guild/index.ts').Guild

    const member = {
      user: { id: 'u1' },
      roles: ['r1']
    } as unknown as import('../src/types/guild/index.ts').Member

    const permissions = computeChannelPermissions(computeBasePermissions(member, guild), [
      {
        id: 'r1',
        type: 0,
        allow: DISCORD_PERMISSIONS.SEND_MESSAGES.toString(),
        deny: '0'
      }
    ], member.roles, member.user?.id)

    expect((permissions & DISCORD_PERMISSIONS.VIEW_CHANNEL) === DISCORD_PERMISSIONS.VIEW_CHANNEL).toBe(true)
    expect((permissions & DISCORD_PERMISSIONS.SEND_MESSAGES) === DISCORD_PERMISSIONS.SEND_MESSAGES).toBe(true)
  })
})