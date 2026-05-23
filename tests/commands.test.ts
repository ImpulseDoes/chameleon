import { describe, it, expect } from 'vitest'
import { defineCommand, defineSubcommand } from '../src/commands/command.ts'
import { opt } from '../src/commands/options.ts'

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
      }
    })

    expect(cmd.subcommands).toBeDefined()
    expect(cmd.subcommands!.get.description).toBe('Get a config value')
    expect(cmd.subcommands!.set.options!.value.required).toBe(true)
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