export interface ShardOptions {
  token: string
  totalShards?: number | 'auto'
  respawn?: boolean
}