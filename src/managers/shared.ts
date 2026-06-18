export function createAuditLogHeaders(reason?: string): Record<string, string> | undefined {
 
  if (!reason) return undefined
 
  return { 'X-Audit-Log-Reason': encodeURIComponent(reason) }
}