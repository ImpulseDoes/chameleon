import * as fs from 'fs'
import * as path from 'path'

export class AttachmentBuilder {

  public name: string
  public data: Buffer | Uint8Array
  public description?: string
  public contentType?: string
  public spoiler: boolean = false

  constructor(data: Buffer | Uint8Array | string, options?: { name?: string, description?: string, contentType?: string, spoiler?: boolean }) {

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
    if (options?.spoiler !== undefined) this.spoiler = options.spoiler
  }

  public setName(name: string): this {

    this.name = name

    return this
  }

  public setDescription(description: string): this {

    this.description = description

    return this
  }

  public setSpoiler(spoiler: boolean = true): this {

    this.spoiler = spoiler

    return this
  }

  public get finalName(): string {
    return this.spoiler && !this.name.startsWith('SPOILER_') ? `SPOILER_${this.name}` : this.name
  }

  public toAttachmentJSON(index: number): Record<string, unknown> {

    return {
      id: index,
      filename: this.finalName,
      ...(this.description ? { description: this.description } : {})
    }
  }
}