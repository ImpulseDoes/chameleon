import { DISCORD_PERMISSIONS } from '../types/types.js'

export type PermissionFlag = typeof DISCORD_PERMISSIONS[keyof typeof DISCORD_PERMISSIONS]

/**
 * Check if a permission string contains a specific flag
 */
export function hasPermission(permissions: string | bigint, flag: bigint): boolean {

  const bits = typeof permissions === 'string' ? BigInt(permissions) : permissions

  if ((bits & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR) {
    return true
  }

  return (bits & flag) === flag
}

/**
 * Check if a permission string contains ALL of the given flags
 */
export function hasAllPermissions(permissions: string | bigint, ...flags: bigint[]): boolean {

  const bits = typeof permissions === 'string' ? BigInt(permissions) : permissions

  if ((bits & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR) {
    return true
  }

  for (const flag of flags) {
    if ((bits & flag) !== flag) return false
  }

  return true
}

/**
 * Check if a permission string contains ANY of the given flags
 */
export function hasAnyPermission(permissions: string | bigint, ...flags: bigint[]): boolean {

  const bits = typeof permissions === 'string' ? BigInt(permissions) : permissions

  if ((bits & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR) {
    return true
  }

  for (const flag of flags) {
    if ((bits & flag) === flag) return true
  }

  return false
}

/**
 * Combine multiple permission flags into one bigint
 */
export function combinePermissions(...flags: bigint[]): bigint {

  let result = 0n
  for (const flag of flags) result |= flag

  return result
}

/**
 * List all permission names present in a permission string
 */
export function listPermissions(permissions: string | bigint): string[] {

  const bits = typeof permissions === 'string' ? BigInt(permissions) : permissions
  const result: string[] = []

  for (const [name, flag] of Object.entries(DISCORD_PERMISSIONS)) {
    if ((bits & flag) === flag) result.push(name)
  }

  return result
}