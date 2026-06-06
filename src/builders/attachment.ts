import * as fs from 'fs'
import * as path from 'path'

export class AttachmentBuilder {

  public name: string
  public data: Buffer | Uint8Array
  public description?: string
  public contentType?: string

  constructor(data: Buffer | Uint8Array | string, options?: { name?: string, description?: string, contentType?: string }) {

    if (typeof data === 'string') {

      const resolved = path.resolve(data)
      this.data = fs.readFileSync(resolved)
      this.name = options?.name ?? path.basename(resolved)

    } else {
      this.data = data
      this.name = options?.name ?? 'file.bin'
    }

    if (options?.description !== undefined) this.description = options.description
    if (options?.contentType !== undefined) this.contentType = options.contentType
  }

  public setName(name: string): this {

    this.name = name

    return this
  }

  public setDescription(description: string): this {

    this.description = description

    return this
  }

  public toAttachmentJSON(index: number): Record<string, unknown> {

    return {
      id: index,
      filename: this.name,
      ...(this.description ? { description: this.description } : {})
    }
  }
}