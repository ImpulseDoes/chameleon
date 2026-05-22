import type { Embed, EmbedField, EmbedFooter, EmbedAuthor, EmbedImage } from '../types/message/index.js'

export class EmbedBuilder {

  private data: Partial<Embed> = {}

  setTitle(title: string): this { this.data.title = title; return this }
  setDescription(description: string): this { this.data.description = description; return this }
  setColor(color: number): this { this.data.color = color; return this }
  setURL(url: string): this { this.data.url = url; return this }

  setTimestamp(ts?: Date | number): this {
    this.data.timestamp = ts instanceof Date ? ts.getTime() : (ts ?? Date.now())
    return this
  }

  setFooter(text: string, iconUrl?: string): this {
    this.data.footer = { text, ...(iconUrl ? { iconUrl } : {}) } as EmbedFooter
    return this
  }

  setAuthor(name: string, iconUrl?: string, url?: string): this {
    this.data.author = { name, ...(iconUrl ? { iconUrl } : {}), ...(url ? { url } : {}) } as EmbedAuthor
    return this
  }

  setImage(url: string): this {
    this.data.image = { url } as EmbedImage
    return this
  }

  setThumbnail(url: string): this {
    this.data.thumbnail = { url } as EmbedImage
    return this
  }

  addField(name: string, value: string, inline = false): this {
    if (!this.data.fields) this.data.fields = []
    this.data.fields.push({ name, value, inline })
    return this
  }

  addFields(...fields: EmbedField[]): this {
    if (!this.data.fields) this.data.fields = []
    this.data.fields.push(...fields)
    return this
  }

  build(): Embed {
    return { ...this.data } as Embed
  }

  toJSON(): Embed {
    return this.build()
  }
}