export interface Option {
	label: string;
	value: string;
}

export type AcceptedOptions = string[] | Option[] | { title: string; options: string[] | Option[] }[];

export type OptionGroup = {
	title: string;
	options: Option[];
};
