import { describe, it, expect } from 'vitest'
import { Tongue } from '../src/utils/tongue.ts'
import { Collection } from '../src/utils/collection.ts'

describe('Tongue (Cache)', () => {

  it('should set and get values', () => {

    const cache = new Tongue<string, number>()

    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
  })

  it('should return undefined for missing keys', () => {

    const cache = new Tongue<string, number>()

    expect(cache.get('missing')).toBeUndefined()
  })

  it('should evict oldest entry when maxSize is exceeded', () => {

    const cache = new Tongue<string, number>(2)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3) // should evict 'a'
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
    expect(cache.size).toBe(2)
  })

  it('should promote accessed entries (LRU behavior)', () => {

    const cache = new Tongue<string, number>(2)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a') // promote 'a', now 'b' is oldest
    cache.set('c', 3) // should evict 'b'
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(3)
  })

  it('should overwrite existing key without increasing size', () => {

    const cache = new Tongue<string, number>(3)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 10) // overwrite
    expect(cache.size).toBe(2)
    expect(cache.get('a')).toBe(10)
  })

  it('should report has() correctly', () => {

    const cache = new Tongue<string, number>()

    cache.set('a', 1)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(false)
  })

  it('should delete entries', () => {

    const cache = new Tongue<string, number>()

    cache.set('a', 1)
    expect(cache.delete('a')).toBe(true)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.size).toBe(0)
    expect(cache.delete('nope')).toBe(false)
  })

  it('should clear all entries', () => {

    const cache = new Tongue<string, number>()

    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })

  it('should iterate values and keys', () => {

    const cache = new Tongue<string, number>()

    cache.set('x', 10)
    cache.set('y', 20)
    expect([...cache.values()]).toEqual([10, 20])
    expect([...cache.keys()]).toEqual(['x', 'y'])
  })

  it('should work with Infinity maxSize (default)', () => {

    const cache = new Tongue<string, number>()
    
    for (let i = 0; i < 1000; i++) {
      cache.set(`key${i}`, i)
    }
    expect(cache.size).toBe(1000)
    expect(cache.get('key0')).toBe(0)
    expect(cache.get('key999')).toBe(999)
  })

  it('collection.reduce should throw on empty collection without initial value', () => {

    const collection = new Collection<string, number>()

    expect(() => collection.reduce<number>((acc, value) => acc + value)).toThrow(TypeError)
  })
})