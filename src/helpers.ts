import { isBoolean, isFunction, toArray } from '@morev/helpers';
import type { GeneratorEntry, IObject } from './types';

/**
 * Converts main 'CLI make' rule to prompt ready-to-use with inquirer.js
 *
 * @param     {object}     declaration   Rule declaration
 * @param     {Function}   i18n          I18n function
 *
 * @returns   {Array}                    Ready-to-use array for inquirer.js
 */
export const ruleToPrompt = (declaration: GeneratorEntry, i18n: Function) => {
	const result = [{
		type: 'input',
		name: 'names',
		message: i18n(declaration.message),
		validate: (value: string) => !value.includes(''),
		filter: (value: string) => value.split(' ').map(i => i.trim()),
	}] as any[];

	if (!declaration.options) return result;

	const options = toArray(declaration.options);

	options.forEach(option => {
		result.push({
			type: option.type,
			name: option.name,
			message: i18n(option.message),
			when: (isFunction(option.when) || isBoolean(option.when)) ? option.when : true,
			choices: Object.entries(option.choices ?? {}).reduce<any[]>((acc, [flag, description]) => {
				acc.push({
					name: i18n(description),
					value: flag,
					checked: option.type === 'checkbox'
						? flag === option.default
						: option.default ?? Object.keys(option.choices ?? {})[0],
				});
				return acc;
			}, []),
			filter: (values: string[]) => {
				// Convert array to object for consistency with commander.js
				if (option.type === 'checkbox') {
					return values.reduce<IObject>((a, b) => ({ ...a, [b]: true }), {});
				}
				return values;
			},
		});
	});

	return result;
};
