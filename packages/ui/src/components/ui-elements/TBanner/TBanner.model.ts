export const BannerType = {
	DEFAULT: 'default',
	INFO: 'info',
	WARNING: 'warning',
	ERROR: 'error',
	SUCCESS: 'success',
};

export type BannerType = (typeof BannerType)[keyof typeof BannerType];
