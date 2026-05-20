import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from './logger'

describe('logger utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-05-27T16:00:00.000Z')
  })

  it('logs debug messages with a formatted prefix', () => {
    logger.debug('Test debug message')
    expect(console.debug).toHaveBeenCalledWith('[2025-05-27T16:00:00.000Z] DEBUG:', 'Test debug message')
  })

  it('logs warning messages with a formatted prefix', () => {
    logger.warning('Test warning message')
    expect(console.warn).toHaveBeenCalledWith('[2025-05-27T16:00:00.000Z] WARNING:', 'Test warning message')
  })

  it('logs error messages with a formatted prefix', () => {
    logger.error('Test error message')
    expect(console.error).toHaveBeenCalledWith('[2025-05-27T16:00:00.000Z] ERROR:', 'Test error message')
  })

  it('logs info messages with a formatted prefix', () => {
    logger.info('Test info message')
    expect(console.info).toHaveBeenCalledWith('[2025-05-27T16:00:00.000Z] INFO:', 'Test info message')
  })

  it('logs generic messages with a formatted prefix', () => {
    logger.log('Test log message')
    expect(console.log).toHaveBeenCalledWith('[2025-05-27T16:00:00.000Z] LOG:', 'Test log message')
  })

  it('passes through multiple arguments after the prefix', () => {
    logger.info('Message', { data: 'test' }, 123)
    expect(console.info).toHaveBeenCalledWith('[2025-05-27T16:00:00.000Z] INFO:', 'Message', { data: 'test' }, 123)
  })
})
