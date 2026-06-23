import { Collection } from './collection.js'

class ListNode<K> {
  key: K
  prev: ListNode<K> | null = null
  next: ListNode<K> | null = null
  constructor(key: K) {
    this.key = key
  }
}

/**
 * Chameleon's internal store structure,
 * acts as an least recently used cache to optimize memory usage
 * it's named Tongue because a chameleon catches things with its tongue, you get it right? Right??? RIGHT?!?!?
 */
export class Tongue<K, V> extends Collection<K, V> {

  public max: number
  private head: ListNode<K> | null = null
  private tail: ListNode<K> | null = null
  private keyMap: Map<K, ListNode<K>> = new Map()
  public onEvict?: (key: K, value: V) => void

  constructor(maxSize: number = Infinity) {
    super()
    this.max = maxSize
  }

  private moveToTail(node: ListNode<K>) {

    if (this.tail === node) return // Already at tail

    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev

    if (this.head === node) {
      this.head = node.next
    }

    node.prev = this.tail
    node.next = null

    if (this.tail) this.tail.next = node
    this.tail = node

    if (!this.head) this.head = node
  }

  private evictHead() {

    if (!this.head) return
    
    const keyToEvict = this.head.key
    
    this.head = this.head.next
    
    if (this.head) {
      this.head.prev = null
    } else {
      this.tail = null
    }
    
    this.keyMap.delete(keyToEvict)

    const val = super.get(keyToEvict)
    
    super.delete(keyToEvict)
    
    if (this.onEvict && val !== undefined) {
      this.onEvict(keyToEvict, val)
    }
  }

  override get(key: K): V | undefined {

    if (!super.has(key)) return undefined

    const node = this.keyMap.get(key)

    if (node) {
      this.moveToTail(node)
    }

    return super.get(key)!
  }

  override set(key: K, val: V): this {

    if (super.has(key)) {
    
      super.set(key, val)
    
      const node = this.keyMap.get(key)
    
      if (node) this.moveToTail(node)
    
      } else {
    
      if (this.size >= this.max) {
        this.evictHead()
      }
    
      super.set(key, val)
    
      const newNode = new ListNode(key)
    
      this.keyMap.set(key, newNode)

      if (!this.head) {
        this.head = newNode
        this.tail = newNode
      } else {
        newNode.prev = this.tail
        if (this.tail) this.tail.next = newNode
        this.tail = newNode
      }
    }
    return this
  }

  override delete(key: K): boolean {

    if (!super.has(key)) return false

    const node = this.keyMap.get(key)

    if (node) {
    
      if (node.prev) node.prev.next = node.next
      if (node.next) node.next.prev = node.prev

      if (this.head === node) this.head = node.next
      if (this.tail === node) this.tail = node.prev

      this.keyMap.delete(key)
    }

    return super.delete(key)
  }

  override clear(): void {
    super.clear()
    this.keyMap.clear()
    this.head = null
    this.tail = null
  }
}