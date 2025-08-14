import { describe, it, expect } from 'vitest';
import { errors, isEmail } from './validation';

describe('isEmail', () => {
	it('should return status 200 for valid email addresses', () => {
		const validEmails = [
			'test@example.com',
			'user.name+tag+sorting@example.com',
			'user.name@example.co.uk',
			'user_name@example.org',
			'username@example.museum',
			'user-name@example.io',
			'username@subdomain.example.com',
		];

		validEmails.forEach((email) => {
			expect(isEmail(email)).toEqual({
				status: 200,
				message: 'Valid email',
			});
		});
	});

	it('should return appropriate error messages for invalid email addresses', () => {
		const invalidEmails = [
			{
				email: '',
				expected: { status: 400, message: errors.EMAIL_REQUIRED },
			},
			{
				email: 'plainaddress',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: '@missinglocalpart.com',
				expected: { status: 400, message: errors.INVALID_LOCAL },
			},
			{
				email: 'username@.com',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@.com.',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@com',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@-example.com',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@example..com',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@example.com.',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@.example.com',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@com.',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'user name@example.com',
				expected: { status: 400, message: errors.INVALID_LOCAL },
			},
			{
				email: 'user@name@example.com',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'user@name@domain.com',
				expected: { status: 400, message: errors.INVALID_DOMAIN },
			},
			{
				email: 'username@example.c',
				expected: { status: 400, message: errors.TLD_REQUIRED },
			},
			{
				email: 'username@example.123',
				expected: { status: 400, message: errors.INVALID_TLD },
			},
		];

		invalidEmails.forEach(({ email, expected }) => {
			expect(isEmail(email)).toEqual(expected);
		});
	});
});
