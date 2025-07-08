/**
 * <!-- TRANSLATE -->
 */
export const errors = {
	REQUIRED: 'This field is required',
	VALID_EMAIL: 'Valid email',
	INVALID_LOCAL: 'Invalid local part of the email',
	INVALID_EMAIL: 'Invalid email',
	INVALID_DOMAIN: 'Invalid domain part of the email',
	DOMAIN_REQUIRED: 'Domain name is required',
	EMAIL_REQUIRED: 'Email is required',
	TLD_REQUIRED: 'Top-level domain must be at least two characters',
	INVALID_TLD: 'Top-level domain cannot contain numbers',
	INVALID_DOMAIN_START: 'Domain cannot start with numbers',
	PASSWORD: 'Password must be at least 8 characters long',
	PASSWORD_MATCH: 'Passwords do not match',
	USERNAME: 'Username must be at least 3 characters long',
};

export const isEmail = (value: string): { status: number; message: string } => {
	if (!value) {
		return { status: 400, message: errors.EMAIL_REQUIRED };
	}

	const [localPart, domain] = value.split('@');

	if (!localPart || !/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
		return { status: 400, message: errors.INVALID_LOCAL };
	}

	if (!domain || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
		return { status: 400, message: errors.INVALID_DOMAIN };
	}

	const domainParts = domain.split('.');
	if (domainParts.length < 2 || domainParts.some((part) => !part || /^-/.test(part))) {
		return { status: 400, message: errors.INVALID_DOMAIN };
	}

	if (domainParts[0] && /^\d/.test(domainParts[0])) {
		return { status: 400, message: errors.INVALID_DOMAIN_START };
	}

	const tld = domainParts[domainParts.length - 1];
	if (tld && tld.length < 2) {
		return { status: 400, message: errors.TLD_REQUIRED };
	}

	if (tld && /\d/.test(tld)) {
		return { status: 400, message: errors.INVALID_TLD };
	}

	return { status: 200, message: errors.VALID_EMAIL };
};
