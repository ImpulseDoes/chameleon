import { describe, it, expect } from 'vitest'
import { EmbedBuilder, Colors } from '../src/builders/embed.ts'

describe('EmbedBuilder', () => {

  it('should build a basic embed with title and description', () => {

    const embed = new EmbedBuilder()
      .setTitle('Test')
      .setDescription('Hello world')

    const json = embed.toJSON()

    expect(json.title).toBe('Test')
    expect(json.description).toBe('Hello world')
  })

  it('should set color from Colors constant', () => {

    const embed = new EmbedBuilder().setColor(Colors.Blurple)

    expect(embed.toJSON().color).toBe(0x5865F2)
  })

  it('should set URL', () => {

    const embed = new EmbedBuilder().setURL('https://example.com')

    expect(embed.toJSON().url).toBe('https://example.com')
  })

  it('should set timestamp as ISO string in JSON', () => {

    const ts = new Date('2025-01-01T00:00:00Z')
    const embed = new EmbedBuilder().setTimestamp(ts)
    const json = embed.toJSON()

    expect(json.timestamp).toBe('2025-01-01T00:00:00.000Z')
  })

  it('should set timestamp without args (uses Date.now)', () => {

    const embed = new EmbedBuilder().setTimestamp()
    const json = embed.toJSON()

    expect(typeof json.timestamp).toBe('string')
  })

  it('should set footer with text and icon', () => {

    const embed = new EmbedBuilder().setFooter('Footer text', 'https://img.png')
    const json = embed.toJSON()
    const footer = json.footer as Record<string, unknown>

    expect(footer.text).toBe('Footer text')
    expect(footer.icon_url).toBe('https://img.png')
  })

  it('should set author with all fields', () => {

    const embed = new EmbedBuilder().setAuthor('Author', 'https://icon.png', 'https://url.com')
    const json = embed.toJSON()
    const author = json.author as Record<string, unknown>

    expect(author.name).toBe('Author')
    expect(author.icon_url).toBe('https://icon.png')
    expect(author.url).toBe('https://url.com')
  })

  it('should set image', () => {

    const embed = new EmbedBuilder().setImage('https://img.png')
    const json = embed.toJSON()
    const image = json.image as Record<string, unknown>

    expect(image.url).toBe('https://img.png')
  })

  it('should set thumbnail', () => {

    const embed = new EmbedBuilder().setThumbnail('https://thumb.png')
    const json = embed.toJSON()
    const thumbnail = json.thumbnail as Record<string, unknown>

    expect(thumbnail.url).toBe('https://thumb.png')
  })

  it('should add single fields', () => {

    const embed = new EmbedBuilder()
      .addField('Name 1', 'Value 1')
      .addField('Name 2', 'Value 2', true)

    const built = embed.build()
    expect(built.fields).toHaveLength(2)

    expect(built.fields?.[0]?.name).toBe('Name 1')
    expect(built.fields?.[0]?.inline).toBe(false)
    expect(built.fields?.[1]?.inline).toBe(true)
  })

  it('should add multiple fields with addFields', () => {

    const embed = new EmbedBuilder().addFields(
      { name: 'A', value: '1', inline: false },
      { name: 'B', value: '2', inline: true }
    )

    const built = embed.build()

    expect(built.fields).toHaveLength(2)
  })

  it('should chain all setters fluently', () => {

    const embed = new EmbedBuilder()
      .setTitle('T')
      .setDescription('D')
      .setColor(0xFF0000)
      .setURL('https://x.com')
      .setFooter('F')
      .setAuthor('A')
      .setImage('https://i.png')
      .setThumbnail('https://t.png')
      .setTimestamp()
      .addField('N', 'V')

    const json = embed.toJSON()

    expect(json.title).toBe('T')
    expect(json.description).toBe('D')
    expect(json.color).toBe(0xFF0000)
  })

  it('should reconstruct from raw Discord embed data', () => {

    const raw = {
      title: 'From API',
      description: 'Desc',
      color: 0x00FF00,
      author: { name: 'Auth', icon_url: 'https://icon.png' },
      footer: { text: 'Foot', icon_url: 'https://foot.png' },
      image: { url: 'https://img.png', proxy_url: 'https://proxy.png', width: 100, height: 200 },
      thumbnail: { url: 'https://th.png' },
      fields: [{ name: 'F', value: 'V', inline: true }],
      timestamp: '2025-06-01T00:00:00.000Z'
    }

    const embed = new EmbedBuilder(raw as any)
    const json = embed.toJSON()

    expect(json.title).toBe('From API')
    expect((json.author as Record<string, unknown>).name).toBe('Auth')
    expect((json.author as Record<string, unknown>).icon_url).toBe('https://icon.png')
    expect((json.footer as Record<string, unknown>).text).toBe('Foot')
    expect((json.image as Record<string, unknown>).url).toBe('https://img.png')
    expect((json.image as Record<string, unknown>).proxy_url).toBe('https://proxy.png')
  })

  it('should build empty embed without errors', () => {

    const embed = new EmbedBuilder()
    const json = embed.toJSON()

    expect(json.timestamp).toBeUndefined()
    expect(json.title).toBeUndefined()
  })
})

describe('Colors', () => {
  it('should have hex color values', () => {
    expect(Colors.Blurple).toBe(0x5865F2)
    expect(Colors.Green).toBe(0x57F287)
    expect(Colors.Red).toBe(0xED4245)
    expect(Colors.White).toBe(0xFFFFFF)
    expect(Colors.Black).toBe(0x23272A)
  })
})