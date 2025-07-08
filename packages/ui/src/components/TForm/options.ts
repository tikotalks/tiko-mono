export interface CollapseOptions {
	collapse?: boolean;
	auto?: boolean;
	delay?: number;
}
export const defaultCollapseOptions: Required<CollapseOptions> = {
	collapse: false,
	auto: false,
	delay: 1000,
};

export const collapseOptions = (options: CollapseOptions): Required<CollapseOptions> => {
	return { ...defaultCollapseOptions, ...options };
};
