import type { Options } from 'tsup';

export const tsup: Options = {
	splitting: false,
	sourcemap: false,
	clean: true,
	format: ['esm'],
	dts: true,
	entryPoints: [
		'src/index.ts',
	],
};
