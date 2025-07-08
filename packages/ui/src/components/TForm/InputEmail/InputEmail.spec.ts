import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import InputEmail from './InputEmail.vue';

describe('InputEmail.vue', () => {
	it('renders correctly', () => {
		const wrapper = mount(InputEmail, {
			props: {
				label: 'Email',
				placeholder: 'Enter your email',
			},
		});
		expect(wrapper.find('label').text()).toBe('Email');
		expect(wrapper.find('input').attributes('placeholder')).toBe('Enter your email');
	});

	it('sets initial value from props', () => {
		const wrapper = mount(InputEmail, {
			props: {
				'modelValue': 'test@example.com',
				'onUpdate:modelValue': () => {},
			},
		});
		expect(wrapper.find('input').element.value).toBe('test@example.com');
	});

	it('updates model value correctly', async () => {
		const wrapper = mount(InputEmail, {
			props: {
				'modelValue': 'test@example.com',
				'onUpdate:modelValue': () => {},
			},
		});
		const input = wrapper.find('input');
		await input.setValue('new@example.com');
		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['new@example.com']);
	});

	it('emits change event on input', async () => {
		const wrapper = mount(InputEmail, {
			props: {
				'modelValue': 'test@example.com',
				'onUpdate:modelValue': () => {},
			},
		});
		const input = wrapper.find('input');
		await input.setValue('new@example.com');
		expect(wrapper.emitted().change?.[0]).toEqual(['new@example.com']);
	});

	it('validates email correctly', async () => {
		const wrapper = mount(InputEmail, {
			props: {
				'modelValue': '',
				'onUpdate:modelValue': () => {},
				'required': true,
			},
			global: {
				stubs: {
					InputBase: false,
				},
			},
		});

		// Simulate input interaction and validation
		const input = wrapper.find('input');
		await input.trigger('focus');
		await input.setValue('');
		await wrapper.findComponent({ name: 'InputBase' }).vm.$emit('touched', true);
		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();

		// First validation: required field
		const errors = wrapper.findAll('.input-email__error');
		if (errors.length === 0) {
			throw new Error('Expected error message to be displayed');
		}
		expect(errors.at(0)?.text()).toBe('Email is required');

		// Invalid email validation
		await input.setValue('invalid-email');
		await wrapper.findComponent({ name: 'InputBase' }).vm.$emit('touched', true);
		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();

		const invalidErrors = wrapper.findAll('.input-email__error');
		if (invalidErrors.length === 0) {
			throw new Error('Expected error message to be displayed for invalid email');
		}
		expect(invalidErrors.at(0)?.text()).toBe('Invalid domain part of the email');

		// Valid email validation
		await input.setValue('valid@example.com');
		await wrapper.findComponent({ name: 'InputBase' }).vm.$emit('touched', true);
		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();

		const validErrors = wrapper.findAll('.input-email__error');
		expect(validErrors.length).toBe(0);
	});
});
