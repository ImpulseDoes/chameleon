import { describe, it, expect, vi } from 'vitest'
import { defineCommand, defineSubcommand } from '../src/commands/command.ts'
import { opt } from '../src/commands/options.ts'
import { CommandManager } from '../src/commands/manager.ts'

describe('defineCommand', () => {

  it('should define a basic command with execute', () => {
    
    const cmd = defineCommand({
      name: 'ping',
      description: 'Ping pong',
      execute: async () => {}
    })

    expect(cmd.name).toBe('ping')
    expect(cmd.description).toBe('Ping pong')
    expect(cmd.execute).toBeDefined()
  })

  it('should define a command with options', () => {

    const cmd = defineCommand({
      name: 'ban',
      description: 'Ban user',
      options: {
        user: opt.user('Target user', { required: true }),
        reason: opt.string('Ban reason')
      },
      execute: async () => {}
    })

    expect(cmd.options!.user.type).toBe('user')
    expect(cmd.options!.user.required).toBe(true)
    expect(cmd.options!.reason.type).toBe('string')
    expect(cmd.options!.reason.required).toBe(false)
  })

  it('should throw when no execute and no subcommands', () => {
    expect(() => {
      defineCommand({
        name: 'broken',
        description: 'No execute or subcommands'
      })
    }).toThrow()
  })

  it('should allow subcommands without execute', () => {

    const cmd = defineCommand({
      name: 'config',
      description: 'Configuration',
      subcommands: {
        get: defineSubcommand({
          description: 'Get a config value',
          options: {
            key: opt.string('Config key', { required: true })
          },
          execute: async () => {}
        }),
        set: defineSubcommand({
          description: 'Set a config value',
          options: {
            key: opt.string('Config key', { required: true }),
            value: opt.string('Config value', { required: true })
          },
          execute: async () => {}
        })
      } as unknown as Record<string, ReturnType<typeof defineSubcommand>>
    })

    expect(cmd.subcommands).toBeDefined()
    expect(cmd.subcommands!.get!.description).toBe('Get a config value')
    expect(cmd.subcommands!.set!.options!.value!.required).toBe(true)
  })
})

describe('opt (option builders)', () => {

  it('should build string option', () => {

    const o = opt.string('A string', { required: true })

    expect(o.type).toBe('string')
    expect(o.required).toBe(true)
    expect(o.description).toBe('A string')
  })

  it('should default required to false', () => {

    const o = opt.string('Optional')

    expect(o.required).toBe(false)
  })

  it('should build integer option with min/max', () => {

    const o = opt.integer('Level', { required: true, min: 1, max: 100 })

    expect(o.type).toBe('integer')
    expect(o.min).toBe(1)
    expect(o.max).toBe(100)
  })

  it('should build number option', () => {

    const o = opt.number('Amount', { required: false })

    expect(o.type).toBe('number')
  })

  it('should build boolean option', () => {

    const o = opt.boolean('Silent?')

    expect(o.type).toBe('boolean')
    expect(o.required).toBe(false)
  })

  it('should build user option', () => {

    const o = opt.user('Target user', { required: true })

    expect(o.type).toBe('user')
    expect(o.required).toBe(true)
  })

  it('should build channel option', () => {

    const o = opt.channel('Log channel')
    expect(o.type).toBe('channel')

  })

  it('should build role option', () => {

    const o = opt.role('Mute role', { required: true })

    expect(o.type).toBe('role')
    expect(o.required).toBe(true)
  })

  it('should build string option with choices', () => {

    const o = opt.string('Color', {
      required: true,
      choices: [
        { name: 'Red', value: 'red' },
        { name: 'Blue', value: 'blue' }
      ]
    })
    expect(o.choices).toHaveLength(2)

    expect(o.choices?.[0]?.value).toBe('red')
  })
})

describe('CommandManager deployment', () => {

  it('deploys the full global command set across multiple register calls', async () => {

    const put = vi.fn().mockResolvedValue({ ok: true })
    const client = {
      user: { id: 'app-id' },
      rest: { put },
      once: vi.fn()
    } as unknown as ConstructorParameters<typeof CommandManager>[0]

    const manager = new CommandManager(client)

    manager.register(defineCommand({
      name: 'ping',
      description: 'Ping',
      execute: async () => {}
    }))

    manager.register(defineCommand({
      name: 'echo',
      description: 'Echo',
      execute: async () => {}
    }))

    await Promise.resolve()
    await Promise.resolve()

    expect(put).toHaveBeenCalledTimes(2)
    expect(put).toHaveBeenLastCalledWith('/applications/app-id/commands', [
      expect.objectContaining({ name: 'ping' }),
      expect.objectContaining({ name: 'echo' })
    ])
  })

  it('coalesces pre-ready registrations into one deploy per scope', async () => {

    const put = vi.fn().mockResolvedValue({ ok: true })
    let readyHandler: (() => void) | undefined

    const client = {
      user: null,
      rest: { put },
      once: vi.fn((event: string, handler: () => void) => {
        if (event === 'READY') readyHandler = handler
      })
    } as unknown as ConstructorParameters<typeof CommandManager>[0]

    const manager = new CommandManager(client)

    manager.register(defineCommand({
      name: 'ping',
      description: 'Ping',
      execute: async () => {}
    }))

    manager.register(defineCommand({
      name: 'echo',
      description: 'Echo',
      execute: async () => {}
    }))

    expect(client.once).toHaveBeenCalledTimes(1)
    expect(put).not.toHaveBeenCalled()

    ;(client as { user: { id: string } | null }).user = { id: 'app-id' }
    readyHandler?.()

    await Promise.resolve()
    await Promise.resolve()

    expect(put).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith('/applications/app-id/commands', [
      expect.objectContaining({ name: 'ping' }),
      expect.objectContaining({ name: 'echo' })
    ])
  })

  it('auto-defers slow slash commands before Discord timeout', async () => {

    vi.useFakeTimers()

    try {
      const post = vi.fn().mockResolvedValue({ ok: true })
      let release: (() => void) | undefined

      const client = {
        user: { id: 'app-id' },
        rest: { put: vi.fn().mockResolvedValue({ ok: true }), post },
        once: vi.fn(),
        autoDefer: { timeout: 1500, ephemeral: true },
        cache: {
          guilds: new Map(),
          channels: new Map()
        }
      } as unknown as ConstructorParameters<typeof CommandManager>[0]

      const manager = new CommandManager(client)

      manager.register(defineCommand({
        name: 'slow',
        description: 'Slow command',
        execute: async () => new Promise<void>(resolve => {
          release = resolve
        })
      }))

      const interactionPromise = manager.handleInteraction({
        id: 'interaction',
        token: 'token',
        type: 2,
        data: { name: 'slow' },
        user: { id: 'user', username: 'tester' }
      })

      await vi.advanceTimersByTimeAsync(1500)

      expect(post).toHaveBeenCalledWith('/interactions/interaction/token/callback', {
        type: 5,
        data: { flags: 64 }
      })

      release?.()
      await interactionPromise
    } finally {
      vi.useRealTimers()
    }
  })

  it('registerComponent wires handlers into the runtime component manager', async () => {

    const { Client } = await import('../src/client/client.ts')
    const client = new Client({ token: 'test', intents: [] })
    let called = false

    client.commands.registerComponent({
      customId: 'btn1',
      execute: async () => {
        called = true
      }
    })

    await client.components.handleInteraction({
      id: 'i1',
      token: 't1',
      data: { custom_id: 'btn1' },
      user: { id: 'u1', username: 'john' }
    })

    expect(called).toBe(true)
  })

  it('prefers guild-specific commands over global commands with the same name', async () => {

    const { Client } = await import('../src/client/client.ts')
    const client = new Client({ token: 'test', intents: [] })

    let globalCalls = 0
    let guildCalls = 0

    client.commands.register(defineCommand({
      name: 'ping',
      description: 'Global ping',
      execute: async () => {
        globalCalls++
      }
    }))

    client.commands.registerGuild('guild-1', defineCommand({
      name: 'ping',
      description: 'Guild ping',
      execute: async () => {
        guildCalls++
      }
    }))

    await client.commands.handleInteraction({
      id: 'i1',
      token: 't1',
      type: 2,
      guild_id: 'guild-1',
      data: { name: 'ping' },
      user: { id: 'u1', username: 'john' }
    })

    await client.commands.handleInteraction({
      id: 'i2',
      token: 't2',
      type: 2,
      guild_id: 'guild-2',
      data: { name: 'ping' },
      user: { id: 'u1', username: 'john' }
    })

    expect(guildCalls).toBe(1)
    expect(globalCalls).toBe(1)
  })

  it('reuses regex modal handlers safely across multiple interactions', async () => {

    const { Client } = await import('../src/client/client.ts')
    const client = new Client({ token: 'test', intents: [] })

    let calls = 0

    client.commands.registerModal({
      customId: /^modal:/g,
      execute: async () => {
        calls++
      }
    })

    await client.commands.handleInteraction({
      id: 'i1',
      token: 't1',
      type: 5,
      data: { custom_id: 'modal:1', components: [] },
      user: { id: 'u1', username: 'john' }
    })

    await client.commands.handleInteraction({
      id: 'i2',
      token: 't2',
      type: 5,
      data: { custom_id: 'modal:2', components: [] },
      user: { id: 'u1', username: 'john' }
    })

    expect(calls).toBe(2)
  })
})