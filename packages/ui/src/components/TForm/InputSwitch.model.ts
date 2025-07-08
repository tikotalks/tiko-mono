import type { Icons } from 'open-icon';

export interface SwitchOption {
	value: string | boolean | number;
	label: string;
	icon?: Icons | null;
	count?: number;
}
