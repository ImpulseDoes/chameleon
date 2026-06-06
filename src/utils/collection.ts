export class Collection<K, V> extends Map<K, V> {

  public first(): V | undefined {

    return this.values().next().value
  }

  public last(): V | undefined {

    const arr = Array.from(this.values())
    
    return arr[arr.length - 1]
  }

  public random(): V | undefined {

    const arr = Array.from(this.values())

    return arr[Math.floor(Math.random() * arr.length)]
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

    let accumulator: T
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
        // @ts-expect-error TypeScript doesnt know that accumulator has been initialized
        accumulator = fn(accumulator, val, key, this)
      }
    }
    
    // @ts-expect-error TypeScript doesn't know that accumulator has been initialized
    return accumulator
  }

  public toArray(): V[] {
    return Array.from(this.values())
  }
}