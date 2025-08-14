import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TCard from './TCard.vue'
import type { TCardProps, CardAction } from './TCard.model'

describe('TCard', () => {
  it('renders with default props', () => {
    const wrapper = mount(TCard)
    expect(wrapper.find('.card').exists()).toBe(true)
    expect(wrapper.classes()).toContain('card--medium')
  })

  it('renders title when provided', () => {
    const wrapper = mount(TCard, {
      props: {
        title: 'Test Card Title'
      } as TCardProps
    })
    
    expect(wrapper.find('.card__title').exists()).toBe(true)
    expect(wrapper.find('.card__title').text()).toBe('Test Card Title')
  })

  it('renders category with icon', () => {
    const wrapper = mount(TCard, {
      props: {
        category: 'Test Category',
        categoryIcon: 'folder'
      } as TCardProps
    })
    
    const category = wrapper.find('.card__category')
    expect(category.exists()).toBe(true)
    expect(category.find('.card__category-text').text()).toBe('Test Category')
    expect(category.find('.card__category-icon').exists()).toBe(true)
  })

  it('renders emoji when provided', () => {
    const wrapper = mount(TCard, {
      props: {
        emoji: '🎉'
      } as TCardProps
    })
    
    const emoji = wrapper.find('.card__emoji')
    expect(emoji.exists()).toBe(true)
    expect(emoji.text()).toBe('🎉')
  })

  it('renders icon when provided', () => {
    const wrapper = mount(TCard, {
      props: {
        icon: 'heart'
      } as TCardProps
    })
    
    expect(wrapper.find('.card__icon').exists()).toBe(true)
  })

  it('renders image with alt text', () => {
    const wrapper = mount(TCard, {
      props: {
        image: 'test-image.jpg',
        imageAlt: 'Test Image'
      } as TCardProps
    })
    
    const img = wrapper.find('.card__image img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('test-image.jpg')
    expect(img.attributes('alt')).toBe('Test Image')
  })

  it('applies size classes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const
    
    sizes.forEach(size => {
      const wrapper = mount(TCard, {
        props: { size } as TCardProps
      })
      expect(wrapper.classes()).toContain(`card--${size}`)
    })
  })

  it('handles clickable state', async () => {
    const wrapper = mount(TCard, {
      props: {
        clickable: true,
        ariaLabel: 'Click me'
      } as TCardProps
    })
    
    const card = wrapper.find('.card')
    expect(card.classes()).toContain('card--clickable')
    expect(card.attributes('tabindex')).toBe('0')
    expect(card.attributes('role')).toBe('button')
    expect(card.attributes('aria-label')).toBe('Click me')
  })

  it('emits click event when clickable', async () => {
    const wrapper = mount(TCard, {
      props: {
        clickable: true
      } as TCardProps
    })
    
    await wrapper.find('.card').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('handles keyboard events when clickable', async () => {
    const wrapper = mount(TCard, {
      props: {
        clickable: true
      } as TCardProps
    })
    
    const card = wrapper.find('.card')
    
    // Enter key
    await card.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('click')).toHaveLength(1)
    
    // Space key
    await card.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('click')).toHaveLength(2)
  })

  it('does not emit click when not clickable', async () => {
    const wrapper = mount(TCard, {
      props: {
        clickable: false
      } as TCardProps
    })
    
    await wrapper.find('.card').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('applies custom background color', () => {
    const wrapper = mount(TCard, {
      props: {
        backgroundColor: '#ff0000'
      } as TCardProps
    })
    
    expect(wrapper.find('.card').attributes('style')).toContain('background-color: rgb(255, 0, 0)')
  })

  it('renders action buttons', async () => {
    const mockAction = vi.fn()
    const actions: CardAction[] = [
      {
        label: 'Action 1',
        action: mockAction,
        type: 'primary',
        icon: 'check'
      },
      {
        label: 'Action 2',
        action: () => {},
        type: 'ghost'
      }
    ]
    
    const wrapper = mount(TCard, {
      props: { actions } as TCardProps
    })
    
    const actionsSection = wrapper.find('.card__actions')
    expect(actionsSection.exists()).toBe(true)
    
    const buttons = actionsSection.findAll('.card__action')
    expect(buttons).toHaveLength(2)
  })

  it('renders slot content in description', () => {
    const wrapper = mount(TCard, {
      slots: {
        default: '<p>Custom description content</p>'
      }
    })
    
    const description = wrapper.find('.card__description')
    expect(description.exists()).toBe(true)
    expect(description.html()).toContain('<p>Custom description content</p>')
  })

  it('applies correct classes for different content types', () => {
    const wrapper = mount(TCard, {
      props: {
        image: 'test.jpg',
        emoji: '🎉',
        icon: 'heart',
        actions: [{ label: 'Test', action: () => {} }]
      } as TCardProps
    })
    
    expect(wrapper.classes()).toContain('card--has-image')
    expect(wrapper.classes()).toContain('card--has-emoji')
    expect(wrapper.classes()).toContain('card--has-icon')
    expect(wrapper.classes()).toContain('card--has-actions')
  })
})