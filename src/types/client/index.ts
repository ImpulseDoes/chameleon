import type { IntentResolvable } from '../types.js'
import type { ChameleonEvent } from '../../events/index.js'
import type { StoreOptions } from '../../client/store.js'
import type { Message } from '../message/index.js'
import type { ComponentContext } from '../../components/context.js'

export interface AutoDeferOptions {
  timeout?: number
  ephemeral?: boolean
}

export interface ClientOptions<TIntents extends readonly IntentResolvable[]> {
  token: string
  intents: TIntents
  largeThreshold?: number
  sharding?: 'auto' | { shards: number[]; total: number }
  cluster?: boolean
  cache?: StoreOptions
  debug?: boolean
  autoDefer?: boolean | AutoDeferOptions
}

export type EventMap = {
  [K in ChameleonEvent['type']]: Extract<ChameleonEvent, { type: K }>
} & {
  ERROR: { type: 'ERROR'; error: unknown; event?: string }
}

export type MiddlewareFn = {
  (event: ChameleonEvent, next: () => void): void | Promise<void>
  priority?: number
}

export interface AwaitMessagesOptions {
  filter?: (message: Message) => boolean
  max?: number
  time?: number
}

export interface AwaitComponentOptions {
  filter?: (ctx: ComponentContext) => boolean
  time?: number
}