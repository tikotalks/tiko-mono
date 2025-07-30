import chalk from 'chalk';

/**
 * Formats a message with a level and timestamp.
 * @param level - The level of the message.
 * @param args - The arguments to log.
 * @returns The formatted message.
 */
const formatMessage = (level: string, args: any[]) => {
	const timestamp = new Date().toISOString();
	return [`${chalk.gray(`[${timestamp}]`)} ${chalk.bold(level)}:`, ...args];
};

/**
 * Logs a message with a level.
 * @param level - The level of the message.
 * @param args - The arguments to log.
 */
export const logger = {
	debug: (...args: any[]) => {
		console.debug(...formatMessage(chalk.blue('DEBUG'), args));
	},
	warning: (...args: any[]) => {
		console.warn(...formatMessage(chalk.yellow('WARNING'), args));
	},
	error: (...args: any[]) => {
		console.error(...formatMessage(chalk.red('ERROR'), args));
	},
	info: (...args: any[]) => {
		console.info(...formatMessage(chalk.green('INFO'), args));
	},
	log: (...args: any[]) => {
		console.log(...formatMessage(chalk.white('LOG'), args));
	},
};
