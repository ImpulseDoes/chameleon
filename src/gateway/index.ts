import { DISCORD_GATEWAY_OPCODES, Activity } from '../types/types.js'

export interface ChameleonGatewayOptions {
  token: string
  intents: number
  version?: number
  encoding?: 'json' | 'etf'
  largeThreshold?: number
  shard?: [number, number]
}

export type GatewayPayload<T = unknown> = {
  op: number
  d: T
  s?: number | null
  t?: string | null
}

export type GatewayStatus = 'idle' | 'connecting' | 'connected' | 'resuming' | 'disconnected'

const FATAL_CLOSE_CODES = new Set([
  4004, // Authentication failed
  4010, // Invalid shard
  4011, // Sharding required
  4012, // Invalid API version
  4013, // Invalid intent(s)
  4014, // Disallowed intent(s)
])

const NO_RESUME_CLOSE_CODES = new Set([
  4007, // Invalid seq
  4009, // Session timed out
])

export class ChameleonGateway {

  public readonly token: string
  public readonly intents: number
  public readonly version: number
  public ms: number = -1
  public readonly encoding: string
  public readonly largeThreshold: number
  public readonly shard?: [number, number]
  public status: GatewayStatus = 'idle'
  private ws: WebSocket | null = null
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatIntervalMs: number = 45000
  private heartbeatAcked: boolean = true
  private seq: number | null = null
  private sessionId: string | null = null
  private baseUrl: string
  private resumeUrl: string | null = null
  private reconnectAttempts: number = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private _lastHeartbeatSend: number = 0
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map()

  constructor(options: ChameleonGatewayOptions) {

    this.token = options.token
    this.intents = options.intents
    this.version = options.version ?? 10
    this.encoding = options.encoding ?? 'json'
    this.largeThreshold = options.largeThreshold ?? 50
    this.baseUrl = `wss://gateway.discord.gg/?v=${this.version}&encoding=${this.encoding}`

    if (options.shard !== undefined) this.shard = options.shard
  }

  /**
   * Open a new WebSocket connection to the Gateway,
   * if resuming, uses the resume_gateway_url, otherwise uses the base URL
   */
  public connect(): void {

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.clearReconnectTimer()

    const isResuming = this.canResume()
    const url = isResuming && this.resumeUrl
      ? `${this.resumeUrl}?v=${this.version}&encoding=${this.encoding}`
      : this.baseUrl

    this.status = isResuming ? 'resuming' : 'connecting'
    this.emit('debug', `[GATEWAY] Connecting to ${url} (resume=${isResuming})`)

    this.ws = new WebSocket(url)
    this.ws.onopen = this.onOpen.bind(this)
    this.ws.onmessage = this.onMessage.bind(this)
    this.ws.onclose = this.onClose.bind(this)
    this.ws.onerror = this.onError.bind(this)
  }

  /**
   * Gracefully close the connection
   * code 1000/1001 invalidates the session
   * any other code keeps the session alive for resume
   */
  public disconnect(code: number = 1000, reason?: string): void {

    this.stopHeartbeat()
    this.clearReconnectTimer()

    if (code === 1000 || code === 1001) {
      this.sessionId = null
      this.seq = null
      this.resumeUrl = null
    }

    if (this.ws) {
      try {
        this.ws.close(code, reason)
      // eslint-disable-next-line no-empty
      } catch {}
      this.ws = null
    }

    this.status = 'disconnected'
  }

  /**
   * Send a payload to the Gateway.
   */
  public send(op: number, d: unknown): void {

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    this.ws.send(JSON.stringify({ op, d }))
  }

  public pendingPresence: Record<string, unknown> | null = null

  /**
   * Update the presence/status for this shard
   */
  public updatePresence(options: {
    status?: 'online' | 'dnd' | 'idle' | 'invisible' | 'offline'
    activities?: Array<{ name: string; type: number; url?: string; state?: string }>
    afk?: boolean
    since?: number | null
  }): void {
    const payload = {
      since: options.since ?? null,
      activities: options.activities?.map(activity => {
        if (activity.type === Activity.CUSTOM && !activity.state) {
          return {
            ...activity,
            name: "CS",
            state: activity.name
          }
        }
        if (activity.type === Activity.STREAMING && !activity.url) {
          return {
            ...activity,
            url: "https://twitch.tv/discord"
          }
        }
        return activity
      }) ?? [],
      status: options.status ?? 'online',
      afk: options.afk ?? false
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingPresence = payload
      return
    }

    this.send(DISCORD_GATEWAY_OPCODES.PRESENCE_UPDATE, payload)
  }

  /**
   * request offline/large guild members from the Gateway
   * this is used to lazy-load members into the cache via GUILD_MEMBERS_CHUNK events
   */
  public requestGuildMembers(options: {
    guildId: string | string[]
    query?: string
    limit: number
    presences?: boolean
    userIds?: string | string[]
    nonce?: string
  }): void {
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('[GATEWAY] Cannot request guild members while disconnected')
    }

    const payload: Record<string, unknown> = {
      guild_id: options.guildId,
      limit: options.limit,
    }

    if (options.query !== undefined) payload.query = options.query
    if (options.presences !== undefined) payload.presences = options.presences
    if (options.userIds !== undefined) payload.user_ids = options.userIds
    if (options.nonce !== undefined) payload.nonce = options.nonce

    this.send(DISCORD_GATEWAY_OPCODES.REQUEST_GUILD_MEMBERS, payload)
  }

  /**
   * Register an event listener.
   */
  public on<T = unknown>(event: string, listener: (data: T) => void): void {

    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    this.listeners.get(event)!.push(listener as (data: unknown) => void)
  }

  /**
   * Remove all listeners for a specific event, or all listeners entirely.
   */
  public removeAllListeners(event?: string): void {

    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }


  private emit(event: string, data?: unknown): void {

    const handlers = this.listeners.get(event)

    if (!handlers) return

    for (const handler of handlers) {
      handler(data)
    }
  }

  private onOpen(): void {

    this.emit('debug', '[GATEWAY] WebSocket connection opened')
  }

  private onMessage(event: MessageEvent): void {

    let payload: GatewayPayload

    try {
      payload = JSON.parse(event.data as string)
    } catch (err) {

      this.emit('debug', `[GATEWAY] Failed to parse payload: ${err}`)

      return
    }

    if (payload.s !== null && payload.s !== undefined) {
      this.seq = payload.s
    }

    switch (payload.op) {

      case DISCORD_GATEWAY_OPCODES.HELLO: {

        const hello = payload.d as { heartbeat_interval: number }

        this.heartbeatIntervalMs = hello.heartbeat_interval
        this.heartbeatAcked = true
        this.startHeartbeat()
        this.identify()

        break
      }

      case DISCORD_GATEWAY_OPCODES.HEARTBEAT_ACK: {

        this.heartbeatAcked = true
        this.ms = Date.now() - this._lastHeartbeatSend
        this.emit('heartbeatAck')

        break
      }

      case DISCORD_GATEWAY_OPCODES.HEARTBEAT: {

        this.sendHeartbeat()

        break
      }

      case DISCORD_GATEWAY_OPCODES.DISPATCH: {

        this.handleDispatch(payload)

        break
      }

      case DISCORD_GATEWAY_OPCODES.RECONNECT: {

        this.emit('debug', '[GATEWAY] Received Reconnect, reconnecting...')

        this.scheduleReconnect()

        break
      }

      case DISCORD_GATEWAY_OPCODES.INVALID_SESSION: {

        const resumable = payload.d as boolean
        this.emit('debug', `[GATEWAY] Invalid Session (resumable=${resumable})`)

        if (!resumable) {
          this.sessionId = null
          this.seq = null
          this.resumeUrl = null
        }

        const delay = 1000 + Math.random() * 4000

        this.disconnect(4900, 'Invalid session')
        setTimeout(() => this.connect(), delay)

        break
      }
    }
  }

  private onClose(event: CloseEvent): void {

    const { code, reason } = event

    this.stopHeartbeat()
    this.emit('debug', `[GATEWAY] Connection closed (code=${code}, reason=${reason || 'none'})`)
    this.emit('disconnected', { code, reason })

    if (FATAL_CLOSE_CODES.has(code)) {

      this.status = 'disconnected'
      this.emit('error', new Error(`[GATEWAY] Fatal close code ${code}: ${reason}`))

      return
    }

    if (NO_RESUME_CLOSE_CODES.has(code)) {
      this.sessionId = null
      this.seq = null
      this.resumeUrl = null
    }

    this.status = 'disconnected'
    this.scheduleReconnect()
  }

  private onError(event: Event): void {
    this.emit('debug', `[GATEWAY] WebSocket error`)
    this.emit('error', event)
  }

  private handleDispatch(payload: GatewayPayload): void {

    const { t, d } = payload

    if (t === 'READY') {
      const ready = d as { session_id: string; resume_gateway_url: string }
      this.sessionId = ready.session_id
      this.resumeUrl = ready.resume_gateway_url
      this.status = 'connected'
      this.reconnectAttempts = 0
      this.emit('debug', `[GATEWAY] READY (session=${this.sessionId})`)
    }

    if (t === 'RESUMED') {
      this.status = 'connected'
      this.reconnectAttempts = 0
      this.emit('debug', '[GATEWAY] Session resumed successfully')
    }

    this.emit('dispatch', payload)
  }

  /**
   * Start the heartbeat loop
   * first heartbeat is sent after interval * jitter
   * subsequent heartbeats are sent every interval ms
   */
  private startHeartbeat(): void {

    this.stopHeartbeat()

    const jitter = Math.random()
    const firstDelay = Math.floor(this.heartbeatIntervalMs * jitter)

    this.emit('debug', `[GATEWAY] Starting heartbeat (interval=${this.heartbeatIntervalMs}ms, firstDelay=${firstDelay}ms)`)

    this.heartbeatTimer = setTimeout(() => {
      this.sendHeartbeat()
      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat()
      }, this.heartbeatIntervalMs)
    }, firstDelay)
  }

  /**
   * send a single heartbeat, if the previous one was not ACKed,
   * we close and reconnect
   */
  private sendHeartbeat(): void {

    if (!this.heartbeatAcked) {

      this.emit('debug', '[GATEWAY] Heartbeat ACK not received, reconnecting...')
      this.disconnect(4900, 'Zombie connection (no heartbeat ACK)')
      this.scheduleReconnect()

      return
    }

    this.heartbeatAcked = false
    this._lastHeartbeatSend = Date.now()
    this.send(DISCORD_GATEWAY_OPCODES.HEARTBEAT, this.seq)
  }

  private stopHeartbeat(): void {

    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private canResume(): boolean {

    return this.sessionId !== null && this.seq !== null
  }

  /**
   * send Identify or Resume depending on whether we have an active session
   */
  private identify(): void {

    if (this.canResume()) {
      this.emit('debug', `[GATEWAY] Resuming session ${this.sessionId} at seq ${this.seq}`)
      this.send(DISCORD_GATEWAY_OPCODES.RESUME, {
        token: this.token,
        session_id: this.sessionId,
        seq: this.seq
      })
    } else {
      this.emit('debug', '[GATEWAY] Identifying as new session')
      this.send(DISCORD_GATEWAY_OPCODES.IDENTIFY, {
        token: this.token,
        intents: this.intents,
        properties: {
          os: process.platform ?? 'linux',
          browser: 'chameleon',
          device: 'chameleon'
        },
        large_threshold: this.largeThreshold,
        ...(this.shard ? { shard: this.shard } : {}),
        ...(this.pendingPresence ? { presence: this.pendingPresence } : {})
      })
    }
  }

  /**
   * schedule a reconnect with exponential backoff
   * delay: min(1s * 2^attempt, 30s) + jitter
   */
  private scheduleReconnect(): void {

    this.clearReconnectTimer()

    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000)
    const jitter = Math.random() * 1000
    const delay = baseDelay + jitter

    this.reconnectAttempts++
    this.emit('debug', `[GATEWAY] Reconnecting in ${Math.round(delay)}ms (attempt #${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private clearReconnectTimer(): void {

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}