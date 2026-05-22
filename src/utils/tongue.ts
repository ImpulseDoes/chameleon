/**
 * Chameleon's internal store structure,
 * acts as an least recently used cache to optimize memory usage
 * it's named Tongue because a chameleon catches things with its tongue, you get it right? Right???
 */
export class Tongue<K, V> {

  private map: Map<K, V>
  private max: number

  constructor(maxSize: number = Infinity) {
    
    this.map = new Map<K, V>()
    this.max = maxSize
  }

  get(key: K): V | undefined {

    if (!this.map.has(key)) return undefined

    const val = this.map.get(key)!

    this.map.delete(key)
    this.map.set(key, val)

    return val
  }

  set(key: K, val: V): this {

    if (this.map.has(key)) {

      this.map.delete(key)

    } else if (this.map.size >= this.max) {

      const firstKey = this.map.keys().next().value

      if (firstKey !== undefined) this.map.delete(firstKey)
    }

    this.map.set(key, val)
    return this
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  delete(key: K): boolean {
    return this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }

  get size(): number {
    return this.map.size
  }

  values(): IterableIterator<V> {
    return this.map.values()
  }

  keys(): IterableIterator<K> {
    return this.map.keys()
  }
}