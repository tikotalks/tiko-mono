import { describe, it, expect, vi, beforeEach } from 'vitest';

import { logger } from './logger';

describe('logger utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'debug').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-05-27T16:00:00.000Z');
	});

	describe('logger.debug', () => {
		it('should call console.debug with formatted message', () => {
			logger.debug('Test debug message');
			expect(console.debug).toHaveBeenCalledWith(
				expect.stringContaining('[2025-05-27T16:00:00.000Z]'),
				expect.stringContaining('DEBUG'),
				'Test debug message'
			);
		});
	});

	describe('logger.warning', () => {
		it('should call console.warn with formatted message', () => {
			logger.warning('Test warning message');
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('[2025-05-27T16:00:00.000Z]'),
				expect.stringContaining('WARNING'),
				'Test warning message'
			);
		});
	});

	describe('logger.error', () => {
		it('should call console.error with formatted message', () => {
			logger.error('Test error message');
			expect(console.error).toHaveBeenCalledWith(
				expect.stringContaining('[2025-05-27T16:00:00.000Z]'),
				expect.stringContaining('ERROR'),
				'Test error message'
			);
		});
	});

	describe('logger.info', () => {
		it('should call console.info with formatted message', () => {
			logger.info('Test info message');
			expect(console.info).toHaveBeenCalledWith(
				expect.stringContaining('[2025-05-27T16:00:00.000Z]'),
				expect.stringContaining('INFO'),
				'Test info message'
			);
		});
	});

	describe('logger.log', () => {
		it('should call console.log with formatted message', () => {
			logger.log('Test log message');
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[2025-05-27T16:00:00.000Z]'),
				expect.stringContaining('LOG'),
				'Test log message'
			);
		});
	});

	it('should handle multiple arguments', () => {
		logger.info('Message', { data: 'test' }, 123);
		expect(console.info).toHaveBeenCalledWith(expect.any(String), 'Message', { data: 'test' }, 123);
	});
});
