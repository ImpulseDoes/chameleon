import { Collection } from './collection.js'

/**
 * Chameleon's internal store structure,
 * acts as an least recently used cache to optimize memory usage
 * it's named Tongue because a chameleon catches things with its tongue, you get it right? Right??? RIGHT?!?!?
 */
export class Tongue<K, V> extends Collection<K, V> {

  private max: number

  constructor(maxSize: number = Infinity) {
    super()
    this.max = maxSize
  }

  override get(key: K): V | undefined {

    if (!super.has(key)) return undefined

    const val = super.get(key)!

    super.delete(key)
    super.set(key, val)

    return val
  }

  override set(key: K, val: V): this {

    if (super.has(key)) {

      super.delete(key)

    } else if (this.size >= this.max) {

      const firstKey = this.keys().next().value

      if (firstKey !== undefined) super.delete(firstKey)
    }

    super.set(key, val)
    return this
  }
}