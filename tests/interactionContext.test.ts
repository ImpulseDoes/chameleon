import { describe, it, expect, vi } from 'vitest'
import { BaseInteractionContext } from '../src/commands/context.ts'
import { MESSAGE_FLAGS } from '../src/utils/constants.ts'

describe('BaseInteractionContext', () => {

  it('merges explicit flags with ephemeral replies', async () => {

    const post = vi.fn().mockResolvedValue({ ok: true })
    const client = {
      rest: { post },
      user: { id: 'bot' }
    } as unknown as import('../src/client/client.ts').Client

    const ctx = new BaseInteractionContext(
      client,
      { id: 'interaction', token: 'token' },
      { id: 'user', username: 'tester' } as import('../src/types/user/index.ts').User
    )

    await ctx.reply({
      content: 'pong',
      ephemeral: true,
      flags: MESSAGE_FLAGS.IS_COMPONENTS_V2
    })

    expect(post).toHaveBeenCalledWith('/interactions/interaction/token/callback', {
      type: 4,
      data: expect.objectContaining({
        content: 'pong',
        flags: MESSAGE_FLAGS.EPHEMERAL | MESSAGE_FLAGS.IS_COMPONENTS_V2
      })
    })
  })
})