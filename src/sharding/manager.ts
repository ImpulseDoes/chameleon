import { EventEmitter } from 'events'
import { fork, type ChildProcess } from 'child_process'
import * as path from 'path'
import { ChameleonREST } from '../rest/index.js'
import type { ShardOptions } from '../types/sharding/index.js'

export class Shard extends EventEmitter {

  public id: number
  public manager: CShard
  public process: ChildProcess | null = null
  public ready: boolean = false

  constructor(manager: CShard, id: number) {
    super()
    this.manager = manager
    this.id = id
  }

  public spawn(): Promise<ChildProcess> {

    return new Promise((resolve, reject) => {
      
      const env = {
        ...process.env,
        SHARD_ID: this.id.toString(),
        SHARD_COUNT: this.manager.totalShards.toString(),
        DISCORD_TOKEN: this.manager.token
      }

      this.process = fork(this.manager.file, [], {
        env
      })

      this.process.on('message', (message: unknown) => {

        this.emit('message', message)
        this.manager.emit('message', this, message)
        
        // Handle readiness
        if ((message as Record<string, unknown>)?.type === 'ready') {
          this.ready = true
          this.emit('ready')
          resolve(this.process!)
        }
      })

      this.process.on('exit', (code, signal) => {

        this.emit('death', this.process)
        this.manager.emit('shardDeath', this)
        this.process = null
        this.ready = false

        if (this.manager.respawn) {
          console.warn(`[C-Shard] Shard ${this.id} exited with code ${code} (signal: ${signal})`)
          setTimeout(() => this.spawn().catch(console.error), 5000)
        }
      })

      this.process.on('error', (err) => {
        reject(err)
      })

      // Assuming script handles ready state, but if not we timeout and resolve
      setTimeout(() => {
        if (!this.ready) {
          this.ready = true
          this.emit('ready')
          resolve(this.process!)
        }
      }, 30000) // 30 second timeout for readiness
    })
  }

  public send(message: unknown): Promise<void> {

    return new Promise((resolve, reject) => {
      
      if (!this.process) return reject(new Error('Shard is not running'))
      
      this.process.send(message as import('child_process').Serializable, (err) => {

        if (err) reject(err)
        else resolve()

      })
    })
  }

  public kill(): void {

    if (this.process) {
      this.process.removeAllListeners()
      this.process.kill()
      this.process = null
      this.ready = false
    }
  }
}

export class CShard extends EventEmitter {

  public file: string
  public totalShards: number
  public token: string
  public shards: Map<number, Shard> = new Map()
  public respawn: boolean

  constructor(file: string, options: ShardOptions) {

    super()

    this.file = path.resolve(file)
    this.token = options.token
    this.totalShards = typeof options.totalShards === 'number' ? options.totalShards : 1
    this.respawn = options.respawn ?? true

    if (options.totalShards === 'auto') {
      this.totalShards = -1 // Indicates we need to fetch it before spawning
    }
  }

  public async fetchRecommendedShards(): Promise<number> {
    const rest = new ChameleonREST({ token: this.token })
    const result = await rest.get<unknown>('/gateway/bot')
    
    if (result.ok && result.data && typeof (result.data as Record<string, unknown>).shards === 'number') {
      return (result.data as Record<string, unknown>).shards as number
    }
    
    console.warn('[Chameleon Sharding] Failed to fetch recommended shards from Discord API. Falling back to 1.')
    return 1
  }

  public async spawn(): Promise<Map<number, Shard>> {
    
    if (this.totalShards === -1) {
      this.totalShards = await this.fetchRecommendedShards()
    }
    
    for (let i = 0; i < this.totalShards; i++) {

      const shard = new Shard(this, i)
      this.shards.set(i, shard)
      
      this.emit('shardCreate', shard)
      await shard.spawn()
      
      // Delay to avoid hitting Discord login rate limits
      await new Promise(r => setTimeout(r, 5000))
    }

    return this.shards
  }

  public async broadcast(message: unknown): Promise<void[]> {

    const promises = []
    
    for (const shard of this.shards.values()) {
      promises.push(shard.send(message))
    }

    return Promise.all(promises)
  }
}