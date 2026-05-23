import { describe, it, expect } from 'vitest'
import {
  LIMITS,
  INTERACTION_TYPES,
  COMPONENT_TYPES,
  INTERACTION_CALLBACK_TYPES,
  TEXT_INPUT_STYLES,
  MESSAGE_FLAGS,
  COMMAND_OPTION_TYPES,
  CHAMELEON_VERSION,
  CHAMELEON
} from '../src/utils/constants.ts'

describe('Constants & Enums', () => {

  describe('INTERACTION_TYPES', () => {

    it('should have correct enum values', () => {
      expect(INTERACTION_TYPES.PING).toBe(1)
      expect(INTERACTION_TYPES.APPLICATION_COMMAND).toBe(2)
      expect(INTERACTION_TYPES.MESSAGE_COMPONENT).toBe(3)
      expect(INTERACTION_TYPES.APPLICATION_COMMAND_AUTOCOMPLETE).toBe(4)
      expect(INTERACTION_TYPES.MODAL_SUBMIT).toBe(5)
    })
  })

  describe('COMPONENT_TYPES', () => {

    it('should have correct enum values', () => {
      expect(COMPONENT_TYPES.ACTION_ROW).toBe(1)
      expect(COMPONENT_TYPES.BUTTON).toBe(2)
      expect(COMPONENT_TYPES.STRING_SELECT).toBe(3)
      expect(COMPONENT_TYPES.TEXT_INPUT).toBe(4)
      expect(COMPONENT_TYPES.USER_SELECT).toBe(5)
      expect(COMPONENT_TYPES.ROLE_SELECT).toBe(6)
      expect(COMPONENT_TYPES.MENTIONABLE_SELECT).toBe(7)
      expect(COMPONENT_TYPES.CHANNEL_SELECT).toBe(8)
    })
  })

  describe('INTERACTION_CALLBACK_TYPES', () => {

    it('should have correct enum values', () => {
      expect(INTERACTION_CALLBACK_TYPES.PONG).toBe(1)
      expect(INTERACTION_CALLBACK_TYPES.CHANNEL_MESSAGE_WITH_SOURCE).toBe(4)
      expect(INTERACTION_CALLBACK_TYPES.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE).toBe(5)
      expect(INTERACTION_CALLBACK_TYPES.DEFERRED_UPDATE_MESSAGE).toBe(6)
      expect(INTERACTION_CALLBACK_TYPES.UPDATE_MESSAGE).toBe(7)
      expect(INTERACTION_CALLBACK_TYPES.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT).toBe(8)
      expect(INTERACTION_CALLBACK_TYPES.MODAL).toBe(9)
      expect(INTERACTION_CALLBACK_TYPES.PREMIUM_REQUIRED).toBe(10)
    })
  })

  describe('TEXT_INPUT_STYLES', () => {

    it('should have correct enum values', () => {
      expect(TEXT_INPUT_STYLES.SHORT).toBe(1)
      expect(TEXT_INPUT_STYLES.PARAGRAPH).toBe(2)
    })
  })

  describe('COMMAND_OPTION_TYPES', () => {

    it('should have all option types', () => {
      expect(COMMAND_OPTION_TYPES.SUB_COMMAND).toBe(1)
      expect(COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP).toBe(2)
      expect(COMMAND_OPTION_TYPES.STRING).toBe(3)
      expect(COMMAND_OPTION_TYPES.INTEGER).toBe(4)
      expect(COMMAND_OPTION_TYPES.BOOLEAN).toBe(5)
      expect(COMMAND_OPTION_TYPES.USER).toBe(6)
      expect(COMMAND_OPTION_TYPES.CHANNEL).toBe(7)
      expect(COMMAND_OPTION_TYPES.ROLE).toBe(8)
      expect(COMMAND_OPTION_TYPES.MENTIONABLE).toBe(9)
      expect(COMMAND_OPTION_TYPES.NUMBER).toBe(10)
      expect(COMMAND_OPTION_TYPES.ATTACHMENT).toBe(11)
    })
  })

  describe('MESSAGE_FLAGS', () => {

    it('should be correct bitfields', () => {
      expect(MESSAGE_FLAGS.CROSSPOSTED).toBe(1)
      expect(MESSAGE_FLAGS.IS_CROSSPOST).toBe(2)
      expect(MESSAGE_FLAGS.SUPPRESS_EMBEDS).toBe(4)
      expect(MESSAGE_FLAGS.EPHEMERAL).toBe(64)
      expect(MESSAGE_FLAGS.IS_COMPONENTS_V2).toBe(MESSAGE_FLAGS.IS_COMPONENTS_V2)
    })

    it('should allow bitwise OR for multiple flags', () => {

      const flags = MESSAGE_FLAGS.EPHEMERAL | MESSAGE_FLAGS.SUPPRESS_EMBEDS

      expect(flags).toBe(68)
      expect(flags & MESSAGE_FLAGS.EPHEMERAL).toBeTruthy()
      expect(flags & MESSAGE_FLAGS.SUPPRESS_EMBEDS).toBeTruthy()
      expect(flags & MESSAGE_FLAGS.CROSSPOSTED).toBeFalsy()
    })
  })

  describe('LIMITS', () => {

    it('should have embed limits', () => {
      expect(LIMITS.MAX_EMBED_SIZE).toBe(6000)
      expect(LIMITS.MAX_EMBED_FIELDS).toBe(25)
      expect(LIMITS.MAX_EMBED_TITLE).toBe(256)
      expect(LIMITS.MAX_EMBED_DESCRIPTION).toBe(4096)
    })

    it('should have component limits', () => {
      expect(LIMITS.MAX_ACTION_ROW_BUTTONS).toBe(5)
      expect(LIMITS.MAX_MESSAGE_COMPONENTS).toBe(5)
      expect(LIMITS.MAX_DROPDOWN_OPTIONS).toBe(25)
    })

    it('should have message limits', () => {
      expect(LIMITS.MAX_MESSAGE_CONTENT).toBe(2000)
      expect(LIMITS.MAX_MESSAGE_EMBEDS).toBe(10)
    })
  })

  describe('Package metadata', () => {

    it('should export version and name strings', () => {
      expect(typeof CHAMELEON_VERSION).toBe('string')
      expect(typeof CHAMELEON).toBe('string')
      expect(CHAMELEON_VERSION.length).toBeGreaterThan(0)
    })
  })
})