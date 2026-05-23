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
  Transparent: 0x2F3136,
} as const

export class EmbedBuilder {

  private data: Partial<Embed> = {}

  constructor(data?: Partial<Embed>) {
    if (data) Object.assign(this.data, data)
  }

  setTitle(title: string): this {
    this.data.title = title
    return this
  }

  setDescription(description: string): this {
    this.data.description = description
    return this
  }

  setColor(color: number): this {
    this.data.color = color
    return this
  }

  setURL(url: string): this {
    this.data.url = url
    return this
  }

  setTimestamp(ts: Date | number = Date.now()): this {
  this.data.timestamp = ts instanceof Date ? ts.getTime() : ts
  return this
}

  setFooter(text: string, iconUrl?: string): this {
    this.data.footer = {
      text,
      ...(iconUrl ? { iconUrl } : {}),
    }
    return this
  }

  setAuthor(name: string, iconUrl?: string, url?: string): this {
    this.data.author = {
      name,
      ...(iconUrl ? { iconUrl } : {}),
      ...(url ? { url } : {}),
    }
    return this
  }

  setImage(url: string): this {
    this.data.image = { url }
    return this
  }

  setThumbnail(url: string): this {
    this.data.thumbnail = { url }
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
    return this.data as Embed
  }

  toJSON(): Record<string, unknown> {

    const e = this.data

    const payload: Record<string, unknown> = {}

    if (e.title) payload.title = e.title
    if (e.description) payload.description = e.description
    if (e.color) payload.color = e.color
    if (e.url) payload.url = e.url

    if (e.timestamp) {
      payload.timestamp = new Date(e.timestamp).toISOString()
    }

    if (e.author) {
      payload.author = {
        name: e.author.name,
        ...(e.author.url ? { url: e.author.url } : {}),
        ...(e.author.iconUrl ? { icon_url: e.author.iconUrl } : {}),
        ...(e.author.proxyIconUrl ? { proxy_icon_url: e.author.proxyIconUrl } : {}),
      }
    }

    if (e.footer) {
      payload.footer = {
        text: e.footer.text,
        ...(e.footer.iconUrl ? { icon_url: e.footer.iconUrl } : {}),
        ...(e.footer.proxyIconUrl ? { proxy_icon_url: e.footer.proxyIconUrl } : {}),
      }
    }

    if (e.image?.url) {
      payload.image = {
        url: e.image.url,
      }
    }

    if (e.thumbnail?.url) {
      payload.thumbnail = {
        url: e.thumbnail.url,
      }
    }

    if (e.fields?.length) {
      payload.fields = e.fields.map(f => ({
        name: f.name,
        value: f.value,
        inline: f.inline ?? false,
      }))
    }

    return payload
  }
}