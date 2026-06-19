export class Collection<K, V> extends Map<K, V> {

  public first(): V | undefined {

    return this.values().next().value
  }

  public last(): V | undefined {

    let last: V | undefined

    for (const v of this.values()) last = v
    
    return last
  }

  public random(): V | undefined {

    if (this.size === 0) return undefined

    const target = Math.floor(Math.random() * this.size)
    let i = 0

    for (const v of this.values()) {
      if (i === target) return v
      i++
    }

    return undefined
  }

  public find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {

    for (const [key, val] of this) {

      if (fn(val, key, this)) return val
    }

    return undefined
  }

  public filter(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V> {

    const results = new Collection<K, V>()

    for (const [key, val] of this) {

      if (fn(val, key, this)) results.set(key, val)
    }

    return results
  }

  public map<T>(fn: (value: V, key: K, collection: this) => T): T[] {

    const results: T[] = []

    for (const [key, val] of this) {

      results.push(fn(val, key, this))
    }

    return results
  }

  public some(fn: (value: V, key: K, collection: this) => boolean): boolean {

    for (const [key, val] of this) {

      if (fn(val, key, this)) return true
    }

    return false
  }

  public every(fn: (value: V, key: K, collection: this) => boolean): boolean {

    for (const [key, val] of this) {
      
      if (!fn(val, key, this)) return false
    }

    return true
  }

  public reduce<T>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue?: T): T {

    let accumulator: T | undefined
    let init = false

    if (initialValue !== undefined) {
      accumulator = initialValue
      init = true
    }

    for (const [key, val] of this) {

      if (!init) {

        accumulator = val as unknown as T
        init = true

      } else {
        accumulator = fn(accumulator as T, val, key, this)
      }
    }

    if (!init) {
      throw new TypeError('Reduce of empty collection with no initial value')
    }

    return accumulator as T
  }

  public toArray(): V[] {
    return Array.from(this.values())
  }
}