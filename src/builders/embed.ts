import type { Embed, EmbedField, EmbedFooter, EmbedAuthor, EmbedImage } from '../types/message/index.js'

export const Colors = {
  Blue: 0x1e90ff,
  Purple: 0x9b59b6,
  Orange: 0xff7f50,
  Pink: 0xff6b81,
  White: 0xffffff,
  Blurple: 0x5865F2,
  Green: 0x57F287,
  Yellow: 0xFEE75C,
  Fuchsia: 0xEB459E,
  Red: 0xED4245,
  Black: 0x23272A,
  Transparent: 0x2F3136
} as const

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

  // todo: add a build func here, after we fix it, to accept our typings as well as discord typings
  // so:
  // discord -> cham
  // cham -> discord
  toJSON(): Record<string, unknown> {

    const payload: Record<string, unknown> = {
      ...this.data,
      timestamp: this.data.timestamp ? new Date(this.data.timestamp).toISOString() : undefined
    }

    if (this.data.author) {
      payload.author = {
        name: this.data.author.name,
        url: this.data.author.url,
        icon_url: this.data.author.iconUrl,
        proxy_icon_url: this.data.author.proxyIconUrl
      }
    }

    if (this.data.footer) {
      payload.footer = {
        text: this.data.footer.text,
        icon_url: this.data.footer.iconUrl,
        proxy_icon_url: this.data.footer.proxyIconUrl
      }
    }

    if (this.data.image) {
      payload.image = {
        url: this.data.image.url,
        proxy_url: this.data.image.proxyUrl,
        height: this.data.image.height,
        width: this.data.image.width
      }
    }

    if (this.data.thumbnail) {
      payload.thumbnail = {
        url: this.data.thumbnail.url,
        proxy_url: this.data.thumbnail.proxyUrl,
        height: this.data.thumbnail.height,
        width: this.data.thumbnail.width
      }
    }

    return payload
  }
}