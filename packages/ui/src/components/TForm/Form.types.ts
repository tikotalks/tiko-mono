export * from './InputSwitch.model';

export const FormSize = {
	MEDIUM: 'medium',
	SMALL: 'small',
	LARGE: 'large',
};

export type FormSizeType = (typeof FormSize)[keyof typeof FormSize];
export interface ControlSlotProps<T> {
	id: string;
	value: T;
	disabled: boolean;
	handleInput: (e: Event) => void;
	handleTouch: () => void;
}
