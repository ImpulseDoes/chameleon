export type BitFieldResolvable = string | number | bigint | BitField | BitFieldResolvable[]

export class BitField {

  public static FLAGS: Record<string, bigint> = {}

  public bitfield: bigint

  constructor(bits: BitFieldResolvable = 0n) {
    this.bitfield = (this.constructor as typeof BitField).resolve(bits)
  }

  public has(bit: BitFieldResolvable): boolean {
    const resolved = (this.constructor as typeof BitField).resolve(bit)
    return (this.bitfield & resolved) === resolved
  }

  public any(bit: BitFieldResolvable): boolean {
    const resolved = (this.constructor as typeof BitField).resolve(bit)
    return (this.bitfield & resolved) !== 0n
  }

  public add(...bits: BitFieldResolvable[]): this {

    let total = 0n
    
    for (const bit of bits) {
      total |= (this.constructor as typeof BitField).resolve(bit)
    }
    
    this.bitfield |= total
    
    return this
  }

  public remove(...bits: BitFieldResolvable[]): this {

    let total = 0n
    
    for (const bit of bits) {
      total |= (this.constructor as typeof BitField).resolve(bit)
    }
    
    this.bitfield &= ~total
    
    return this
  }

  public toArray(): string[] {

    const flags = (this.constructor as typeof BitField).FLAGS
    
    return Object.keys(flags).filter(flag => this.has(flags[flag]!))
  }

  public serialize(): Record<string, boolean> {

    const flags = (this.constructor as typeof BitField).FLAGS
    const result: Record<string, boolean> = {}
    
    for (const [flag, value] of Object.entries(flags)) {
      result[flag] = this.has(value)
    }
    
    return result
  }
  
  public equals(other: BitFieldResolvable): boolean {
    return this.bitfield === (this.constructor as typeof BitField).resolve(other)
  }

  public freeze(): Readonly<this> {
    return Object.freeze(this)
  }

  public toString(): string {
    return this.bitfield.toString()
  }

  public toJSON(): string {
    return this.toString()
  }

  public static resolve(bit: BitFieldResolvable): bigint {

    if (typeof bit === 'bigint') return bit
    if (typeof bit === 'number') return BigInt(bit)

    if (bit instanceof BitField) return bit.bitfield

    if (typeof bit === 'string') {

      const flag = this.FLAGS[bit]
      
      if (flag !== undefined) return flag
      
      const parsed = BigInt(bit)
      
      return parsed
    }

    if (Array.isArray(bit)) {
      return bit.reduce<bigint>((acc, b) => acc | this.resolve(b), 0n)
    }

    throw new TypeError(`Cannot resolve BitField from: ${bit}`)
  }
}