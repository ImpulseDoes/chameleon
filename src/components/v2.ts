import { COMPONENT_TYPES, TEXT_INPUT_STYLES } from '../utils/constants.js'
import { resolveButtonStyle, type ButtonDef, type ModalFieldDef } from './define.js'

type ButtonLike = ButtonDef & { type: 'button' }
type JSONEncodable = { toJSON(): Record<string, unknown> }
type V2RawComponent = {
  type: number
  [key: string]: unknown
}
type V2ComponentLike = V2RawComponent | JSONEncodable | ButtonLike

function serializeV2Button(button: Pick<ButtonDef, 'style' | 'label' | 'customId' | 'url' | 'disabled' | 'emoji' | 'skuId'>) {
  const obj: Record<string, unknown> = {
    type: COMPONENT_TYPES.BUTTON,
    custom_id: button.customId,
    url: button.url,
    label: button.label,
    style: resolveButtonStyle(button.style),
    disabled: button.disabled,
    emoji: button.emoji,
    sku_id: button.skuId
  }

  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined))
}

function normalizeV2Component(component: V2ComponentLike): Record<string, unknown> {
  if (component && typeof component === 'object' && 'type' in component && component.type === 'button') {
    return serializeV2Button(component as ButtonLike)
  }

  if (component && typeof (component as { toJSON?: () => Record<string, unknown> }).toJSON === 'function') {
    return (component as { toJSON(): Record<string, unknown> }).toJSON()
  }

  return component as Record<string, unknown>
}

function serializeModalFieldComponent(field: ModalFieldDef<boolean, any>): V2RawComponent {
  return {
    type: field.type === TEXT_INPUT_STYLES.SHORT || field.type === TEXT_INPUT_STYLES.PARAGRAPH
      ? COMPONENT_TYPES.TEXT_INPUT
      : field.type,
    custom_id: field.id,
    required: field.required,
    style: field.type === TEXT_INPUT_STYLES.SHORT || field.type === TEXT_INPUT_STYLES.PARAGRAPH ? field.type : undefined,
    min_length: field.minLength,
    max_length: field.maxLength,
    placeholder: field.placeholder,
    value: field.value,
    options: field.options,
    min_values: field.minValues,
    max_values: field.maxValues
  }
}

class SectionBuilder {
  private readonly data: Record<string, unknown>

  constructor(components: V2ComponentLike[], accessory?: V2ComponentLike) {
    this.data = {
      type: COMPONENT_TYPES.SECTION,
      components
    }

    if (accessory) {
      this.data.accessory = accessory
    }
  }

  accessory(accessory: V2ComponentLike) {
    this.data.accessory = accessory
    return this
  }

  toJSON() {
    return {
      ...this.data,
      components: (this.data.components as V2ComponentLike[]).map(component => normalizeV2Component(component)),
      ...(this.data.accessory ? { accessory: normalizeV2Component(this.data.accessory as V2ComponentLike) } : {})
    }
  }
}

export const TextDisplay = {
  of: (content: string) => ({
    type: COMPONENT_TYPES.TEXT_DISPLAY,
    content
  })
}

export const Thumbnail = {
  of: (url: string, description?: string, spoiler?: boolean) => ({
    type: COMPONENT_TYPES.THUMBNAIL,
    media: { url },
    description,
    spoiler
  })
}

export const Separator = {
  of: (spacing?: number, divider?: boolean) => ({
    type: COMPONENT_TYPES.SEPARATOR,
    spacing,
    divider
  })
}

export const Section = {
  /**
   * Section builder
   * @param components Child components rendered inside the section body
   * @param accessory Optional accessory rendered on the side of the section
   */
  of: (components: V2ComponentLike[], accessory?: V2ComponentLike) => {
    return new SectionBuilder(components, accessory)
  },

  /** @param content Text rendered as a single TextDisplay inside the section */
  text: (content: string) => {
    return Section.of([TextDisplay.of(content)])
  }
}

export const Container = {
  /**
   * Container builder
   * @param components Child components rendered inside the container
   * @param spoiler Whether the container should be hidden behind a spoiler
   */
  of: (components: V2ComponentLike[], spoiler?: boolean) => {
    const obj: Record<string, unknown> = {
      type: COMPONENT_TYPES.CONTAINER,
      components
    }
    if (spoiler !== undefined) {
      obj.spoiler = spoiler
    }
    return obj
  },

  /** Helper for stacking V2 components vertically without manually creating an array */
  stack: (...components: V2ComponentLike[]) => {
    return Container.of(components)
  }
}

export const Label = {
  /** Wrap a modal field component in a V2 label container */
  of: (field: ModalFieldDef<boolean, any>) => ({
    type: COMPONENT_TYPES.LABEL,
    label: field.label,
    component: Object.fromEntries(
      Object.entries(serializeModalFieldComponent(field)).filter(([, value]) => value !== undefined)
    )
  })
}