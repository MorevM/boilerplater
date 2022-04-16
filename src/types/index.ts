/* eslint-disable import/exports-last */
export type IObject = Record<string, any>;

export type ModuleOptions = {
	locales: { [key: string]: string };
	locale: string;
	context: string;
};

export type MessageOptions = {
	depth?: number;
	icon?: boolean;
};

type UpdateReplacements = {
	needle?: string | null;
	replacement: string;
	skipIf?: string | null;
};

export type MessageHelpers = {
	/**
	 * Returns localized message given.
	 *
	 * @param     {string}   message   Message to show.
	 * @param     {any[]}    args      Additional substitutions passed to `i18n`
	 *
	 * @returns   {string}             Localized message.
	 */
	i18n: (message: string, ...args: any[]) => string;
	/**
	 * Prints error message with given parameters in selected locale.
	 *
	 * @param   {string}           message   Message to print
	 * @param   {MessageOptions}   options   Message custom options
	 * @param   {any[]}            args      Additional substitutions passed to `i18n`
	 */
	error: (message: string, options: MessageOptions, ...args: any[]) => void;
	/**
	 * Prints success message with given parameters in selected locale.
	 *
	 * @param   {string}           message   Message to print
	 * @param   {MessageOptions}   options   Message custom options
	 * @param   {any[]}            args      Additional substitutions passed to `i18n`
	 */
	success: (message: string, options: MessageOptions, ...args: any[]) => void;
};

export type Helpers = {
	/**
	 * Gets the clean name from full path.
	 * Clean name is a part after last slash trimmed from start underscore if exists.
	 *
	 * @param     {string}   fullname   Full path.
	 *
	 * @returns   {string}              Clean name.
	 */
	cleanName: (fullname: string) => string;

	/**
	 * Creates the directory for given `pathParts` (relative to current context)
	 * and prints message depending on operation success/failure.
	 *
	 * @param   {string[]}   pathparts   Path to new directory or an array containing path parts.
	 * @param   {boolean}    child       Child directory flag, affects mostly the message nesting.
	 * @param   {string}     entity      Any entity to use, affects the localized message.
	 */
	makeDirectory: (pathParts: string | string[], child?: boolean, entity?: string) => void;

	/**
	 * Creates the file from given template, replaces all replacements found
	 * and prints message depending on operation success/failure.
	 *
	 * @param   {object}            options                Options.
	 * @param   {string|string[]}   options.templatePath   Path to template file relative to current context.
	 * @param   {string|string[]}   options.filePath       Path to new file to create.
	 * @param   {Array}             options.replacements   Replacements, array of tuples. First element is search string / global RegExp, second is replacement string.
	 * @param   {Array}             options.entity         Any entity to use, affects the localized message.
	 */

	makeFile: (options: {
		templatePath: string | string[];
		filePath: string | string[];
		replacements: Array<[string | RegExp, string]>;
		entity?: string;
	}) => void;

	/**
	 * Updates the given file, replaces `needle` to `replacement` or adds replacement content to the end of file. \
	 * Prints message depending on operation success/failure.
	 *
	 * @param   {object}            options                Options.
	 * @param   {string|string[]}   options.filePath       Path to file.
	 * @param   {Array}             options.replacements   An array structured of `{ needle: string | null; replacement: string; skipIf: string | null; }`
	 *                                                     If needle is `null`, then `replacement` content appends to the end of file.
	 */
	updateFile: (options: {
		filePath: string | string[];
		replacements: UpdateReplacements[];
	}) => void;
};

type GeneratorOptions = {
	type: 'checkbox' | 'list';
	message: string;
	name: string;
	choices?: IObject;
	default?: string | string[];
	when?: Function | boolean;
};

export type GeneratorEntry = {
	/**
	 * The main entity name being passed to `commander` instance. \
	 * Makes the controller available to use via this command.
	 */
	command: string;
	/**
	 * The message being shown using interactive interface while asking for names.
	 */
	message: string;
	/**
	 * Additional options for CLI / interactive prompt compatible to `inquirer` spec.
	 */
	options?: GeneratorOptions[];
	/**
	 * Any object with variables being passed to `controller` as is.
	 */
	settings?: IObject;
	/**
	 * Path to the script directory. \
	 * Affects path resolutions using relative paths defined in settings.
	 */
	context?: string;
	/**
	 * Handler of command
	 *
	 * @param   {string}   entity     Current `name`
	 * @param   {object}   option     Normalized `options`
	 * @param   {object}   settings   Settings objects
	 */
	controller: (entity: string, option: IObject, settings: IObject) => void;
};
