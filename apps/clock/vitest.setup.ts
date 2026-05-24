import { vi } from 'vitest'
import { config } from '@vue/test-utils'

const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	clear: vi.fn(),
	removeItem: vi.fn(),
}

global.localStorage = localStorageMock as unknown as Storage

config.global.stubs = {
	transition: false,
	'transition-group': false,
}
