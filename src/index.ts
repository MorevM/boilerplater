/* eslint-disable prefer-template, no-autofix/prefer-template */
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import inquirer from 'inquirer';
import i18n from 'i18n';
import chalk from 'chalk';
import * as figures from 'figures';

import {
	defaults, formatSlashes, isArray, isObject, toArray,
} from '@morev/helpers';
import commonjs from 'commonjs-variables-for-esmodules';
import { ruleToPrompt } from './helpers';
import type {
	MessageHelpers, Helpers, ModuleOptions, GeneratorEntry, IObject,
} from './types';

// eslint-disable-next-line @typescript-eslint/naming-convention
const { __dirname } = commonjs(import.meta);
const program = new Command();

const defaultMessageOptions = { depth: 0, icon: true };
const defaultSettings = { locale: 'ru', locales: {} };

i18n.configure({
	directory: path.join(__dirname, '..', 'locales'),
	defaultLocale: 'en',
});

const addLocaleFile = (context: string, locale: string, file: string) => {
	const catalog = i18n.getCatalog();
	const localeFile = fs.readFileSync(path.join(context, file), { encoding: 'utf8' });
	const newLocale = JSON.parse(localeFile);
	catalog[locale] = catalog[locale] ? { ...catalog[locale], ...newLocale } : newLocale;
};

class Boilerplater {
	#generators: GeneratorEntry[];

	#context: string;

	public constructor(userSettings: Partial<ModuleOptions> = {}) {
		const settings = defaults(defaultSettings, userSettings) as Required<ModuleOptions>;

		this.#generators = [];
		this.#context = settings.context || process.cwd();
		if (isObject(settings.locales)) {
			Object.entries(settings.locales)
				.forEach(([locale, file]) => addLocaleFile(this.#context, locale, file));
		}
		i18n.setLocale(settings.locale);
	}

	public get message(): MessageHelpers {
		return {
			i18n: (message, ...args) => i18n.__(message, ...args),
			error: (message, _options, ...args) => {
				const options = defaults(defaultMessageOptions, _options);
				const _style = chalk.bold.red;
				if (options.depth) options.icon = false;
				let result = _style(options.icon === false ? '  ' : figures.replaceSymbols(`✖ `));
				if (options.depth) result += _style(`${'-'.repeat(options.depth)} `);

				console.log(result + _style(this.message.i18n(message, ...args)));
			},
			success: (message, _options, ...args) => {
				const options = defaults(defaultMessageOptions, _options);
				const _style = chalk.bold.green;
				if (options.depth) options.icon = false;
				let result = _style(options.icon === false ? '  ' : figures.replaceSymbols(`✔︎ `));
				if (options.depth) result += _style(`${'-'.repeat(options.depth)} `);

				console.log(result + _style(this.message.i18n(message, ...args)));
			},
		};
	}

	#withContext(pathParts: string | string[]): string {
		return path.join(this.#context, ...toArray(pathParts));
	}

	public get helpers(): Helpers {
		return {
			cleanName: (fullPath: string) => fullPath.split(/\/|\\/).pop()?.replace(/^_+/, '') ?? '',

			makeDirectory: (pathParts, child = false, entity = 'Directory') => {
				const directoryPath = this.#withContext(pathParts);
				const directoryName = this.helpers.cleanName(directoryPath);
				const baseDepth = child ? 1 : 0;

				if (fs.existsSync(directoryPath)) {
					this.message.error(`${entity} '%s' already exists`, { depth: baseDepth }, directoryName);
					child && this.message.error(`%s`, { depth: baseDepth + 1 }, formatSlashes(directoryPath, { to: '/' }));
					return;
				}

				try {
					fs.mkdirSync(directoryPath, { recursive: true });
					this.message.success(`${entity} '%s' successfully created`, { depth: baseDepth }, directoryName);
					child && this.message.success(`%s`, { depth: baseDepth + 1 }, formatSlashes(directoryPath, { to: '/' }));
				} catch (e) {
					console.log(e);
				}
			},

			makeFile: ({ templatePath, filePath, replacements = [], entity = 'File' }) => {
				templatePath = this.#withContext(templatePath);
				filePath = this.#withContext(filePath);
				const filename = this.helpers.cleanName(filePath);

				let templateContents = '';
				try {
					templateContents = fs.readFileSync(templatePath, { encoding: 'utf8' });
				} catch {
					this.message.error(`Template '%s' not found`, { depth: 1 }, templatePath);
					return;
				}

				templateContents = replacements.reduce((contents, [search, replacement]) => {
					return contents.replaceAll(search, replacement);
				}, templateContents).replace(/^\n{2,}/gm, '\n').trim() + '\n';

				if (fs.existsSync(filePath)) {
					this.message.error(`${entity} '%s' already exists`, { depth: 1 }, filename);
					this.message.error(`%s`, { depth: 2 }, formatSlashes(filePath, { to: '/' }));
					return;
				}

				try {
					// Create subfolders
					const parts = filePath.split(/\\|\//);
					const fileFolderPath = parts.slice(0, -1).join(path.sep);
					fs.mkdirSync(fileFolderPath, { recursive: true });

					fs.writeFileSync(filePath, templateContents);
					this.message.success(`${entity} '%s' successfully created`, { depth: 1 }, filename);
					this.message.success(`%s`, { depth: 2 }, formatSlashes(filePath, { to: '/' }));
				} catch {
					this.message.error(`Unable to create ${entity.toLowerCase()} '%s'`, { depth: 1 }, filename);
				}
			},

			updateFile: ({ filePath, replacements }) => {
				filePath = this.#withContext(filePath);
				const filename = this.helpers.cleanName(filePath);

				try {
					let content = fs.readFileSync(filePath, { encoding: 'utf8' });

					replacements.forEach(({ needle, replacement, skipIf }) => {
						if (skipIf && content.includes(skipIf)) {
							this.message.error(`Content to modify already in use in '%s'`, { depth: 1 }, filename);
							this.message.error(`%s`, { depth: 2 }, formatSlashes(filePath as string, { to: '/' }));
							return;
						}

						if (needle) {
							content = content.replaceAll(needle, replacement);
						} else {
							content += replacement;
						}
					});

					fs.writeFileSync(filePath, content);
					this.message.success(`File '%s' successfully updated`, { depth: 1 }, filename);
					this.message.success(`%s`, { depth: 2 }, formatSlashes(filePath, { to: '/' }));
				} catch {
					this.message.error(`File '%s' doesn't exists or locked`, { depth: 1 }, filename);
					this.message.error(`%s`, { depth: 2 }, formatSlashes(filePath, { to: '/' }));
				}
			},
		};
	}

	public addGenerator(generator: GeneratorEntry) {
		this.#generators.push(generator);
	}

	public listen() {
		this.#generators.forEach(generator => {
			const commanderInstance = program.command(`${generator.command} [names...]`);
			generator.options?.forEach(option => {
				if (option.type === 'checkbox') {
					// Simplify to boolean
					Object.entries(option.choices ?? {}).forEach(([flag, description]) => {
						commanderInstance.option(`--${flag}`, this.message.i18n(description), false);
					});
				}
				if (option.type === 'list') {
					commanderInstance.option(
						`--${option.name} <value>`,
						this.message.i18n(option.message),
						isArray(option.default)
							? option.default[0]
							: Object.keys(option.choices ?? {})[0],
					);
				}
			});

			// Process
			commanderInstance.action(async (commandArgs, args) => {
				// CLI usage
				if (commandArgs.length) {
					// Unsimplify from boolean :)))
					const choicesNameMap = (generator.options ?? [])
						.filter(o => o.type === 'checkbox')
						.reduce<IObject>((acc, { name, choices }) => {
						Object.keys(choices ?? {}).forEach(key => (acc[key] = name));
						return acc;
					}, {});
					Object.entries(choicesNameMap).forEach(([key, name]) => {
						if (key in args) {
							args[name] = { ...args[name], [key]: args[key] };
							// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
							delete args[key];
						}
					});
				// Interactive prompt
				} else {
					const { names: askNames, ...rest } = await inquirer.prompt(ruleToPrompt(generator, this.message.i18n));
					if (!askNames.length) { this.message.i18n(generator.message); return; }
					[commandArgs, args] = [askNames, rest];
				}

				const originalContext = this.#context;
				commandArgs.forEach((el: string) => {
					if (generator.context) this.#context = generator.context;
					generator.controller(el, args, generator.settings ?? {});
					this.#context = originalContext;
				});
			});
		});

		program.parse(process.argv);
	}
}

export default Boilerplater;
