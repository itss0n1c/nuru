import { Command } from '../command.js';
import type { Nuru } from '../index.js';

export const help_cmd = <T extends Nuru>() =>
	new Command<T>({
		name: 'help',
		description: 'Show the help info',
	}).set_handler((client) => client.commands.flatMap((c) => `${c.name} - ${c.description}`).join('\n'));
