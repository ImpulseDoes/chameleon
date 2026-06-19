export class RateLimitError extends Error {
  constructor(public delay: number, public global: boolean) {
    super('Rate limited')
  }
}

export class Bucket {

  public remaining: number = Infinity
  public resetTimestamp: number = 0
  private promiseQueue: Promise<void> = Promise.resolve()

  public async queue<T>(fn: () => Promise<T>): Promise<T> {

    return new Promise((resolve, reject) => {

      this.promiseQueue = this.promiseQueue.catch(() => {}).then(async () => {

        while (true) {

          if (this.remaining <= 0 && Date.now() < this.resetTimestamp) {
            await new Promise(r => setTimeout(r, this.resetTimestamp - Date.now()))
          }

          this.remaining--

          try {
            const res = await fn()
            resolve(res)
            break
          } catch (e) {
            if (e instanceof RateLimitError) {
              await new Promise(r => setTimeout(r, e.delay))
              continue
            }
            reject(e)
            break
          }
        }
      })
    })
  }
}

export class RateLimiter {

  private globalReset: number = 0
  private routeToBucket: Map<string, string> = new Map()
  private buckets: Map<string, Bucket> = new Map()
  private sweepTimer: ReturnType<typeof setInterval> | null = null

  constructor() {

    this.sweepTimer = setInterval(() => {
    
      const now = Date.now()
    
      for (const [key, bucket] of this.buckets) {
        if (now > bucket.resetTimestamp + 300_000) {
          this.buckets.delete(key)
        }
      }
    
      for (const [route, hash] of this.routeToBucket) {
        if (!this.buckets.has(hash)) {
          this.routeToBucket.delete(route)
        }
      }
    }, 300_000)
    // Allow the process to exit even if this timer is still running
    if (this.sweepTimer && typeof this.sweepTimer === 'object' && 'unref' in this.sweepTimer) {
      this.sweepTimer.unref()
    }
  }

  public destroy(): void {
    
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer)
      this.sweepTimer = null
    }
  }

  private getRoute(method: string, endpoint: string): string {

    const path = endpoint.replace(/\/([a-z-]+)\/(?:[0-9]{17,19})/g, (match, p1) => {

      if (['channels', 'guilds', 'webhooks'].includes(p1)) {
        return match
      }

      return `/${p1}/:id`
    })

    const reactionRoute = path.replace(/\/reactions\/[^/]+\/?(@me|[0-9]{17,19})?/g, '/reactions/:emoji/:id')

    return `${method} ${reactionRoute}`
  }

  public async execute(method: string, endpoint: string, requestFn: () => Promise<Response>): Promise<Response> {

    const route = this.getRoute(method, endpoint)
    const bucketId = this.routeToBucket.get(route) ?? route

    let bucket = this.buckets.get(bucketId)

    if (!bucket) {
      bucket = new Bucket()
      this.buckets.set(bucketId, bucket)
    }

    const initialBucket = bucket

    return initialBucket.queue(async () => {

      if (Date.now() < this.globalReset) {
        await new Promise(r => setTimeout(r, this.globalReset - Date.now()))
      }

      const response = await requestFn()

      const global = response.headers.get('x-ratelimit-global') === 'true'
      const retryAfter = response.headers.get('retry-after')

      if (response.status === 429) {

        const delay = retryAfter ? parseFloat(retryAfter) * 1000 : 5000

        if (global) {
          this.globalReset = Date.now() + delay
        }
        throw new RateLimitError(delay, global)
      }

      const hash = response.headers.get('x-ratelimit-bucket')
      const remaining = response.headers.get('x-ratelimit-remaining')
      const resetAfter = response.headers.get('x-ratelimit-reset-after')

      let targetBucket = initialBucket

      if (hash) {
        if (hash !== bucketId) {
          this.routeToBucket.set(route, hash)
          if (!this.buckets.has(hash)) {
            this.buckets.set(hash, initialBucket)
          } else {
            targetBucket = this.buckets.get(hash)!
          }
        }
      }

      if (remaining !== null) {
        targetBucket.remaining = parseInt(remaining, 10)
      }
      if (resetAfter !== null) {
        targetBucket.resetTimestamp = Date.now() + parseFloat(resetAfter) * 1000
      }

      return response
    })
  }
}