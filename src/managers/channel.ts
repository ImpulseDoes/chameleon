import { BaseManager } from './base.js'
import { buildChannel } from '../builders/index.js'
import type { Channel } from '../types/channel/index.js'

export class ChannelManager extends BaseManager<Channel> {
  
  protected storeKey = 'channels' as const
  protected endpoint(id: string) { return `/channels/${id}` }
  protected build = buildChannel
}