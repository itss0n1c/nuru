import { Command, Commands } from './Command';
import BaseStore from './BaseStore';
import chalk from 'chalk';
import arg, { Result } from 'arg';
import help from './cmds/help';

export interface NuruOptions {
	name: string
	verison: string
	accent: [number, number, number],
	commands: Command[]
}

export class Nuru {
	name: string
	version: string
	accent: chalk.Chalk
	args: Result<any>
	commands = new Commands();
	constructor(opts?: Partial<NuruOptions>) {
		this.init(opts);
	}

	log(text: string, showTitle = false, title = false): void {
		const str = `${showTitle ? this.accent(`[${this.name}${title ? ` ${text}` : ''}] `) : ''}${!title ? chalk.white(text) : `v${this.version}\n`}`;
		console.log(str);
	}

	async handleRes(): Promise<void> {
		const cmdname = this.args._[0];
		if (typeof cmdname === 'undefined') {
			return this.log(await this.commands.get('help').handle(this, []));
		}
		const args = this.args._.slice(1, this.args._.length);
		if (this.commands.has(cmdname)) {
			const cmd = this.commands.get(cmdname);
			let res: string;
			try {
				res = await cmd.handle(this, args);
			} catch (e) {
				return console.error(e);
			}

			return this.log(res);
		}
		return this.log(`Command '${cmdname}' not found!`, true);
	}

	async init(opts: Partial<NuruOptions>): Promise<void> {
		if (typeof opts === 'undefined') {
			opts = {};
		}
		this.name = opts.name ?? 'Nuru';
		this.version = opts.verison ?? '1.0.0';
		if (typeof opts.accent !== 'undefined') {
			this.accent = chalk.rgb(opts.accent[0], opts.accent[1], opts.accent[2]);
		} else {
			this.accent = chalk.rgb(28, 119, 255);
		}

		const defaultCommands = [ help ];
		if (typeof opts.commands !== 'undefined') {
			for (const cmd of opts.commands) {
				this.commands.set(cmd.name, cmd);
			}
		}
		for (const cmd of defaultCommands) {
			this.commands.set(cmd.name, cmd);
		}

		try {
			this.args = arg({
				'--help': Boolean,
				'-h': '--help'
			});
		} catch (e) {
			if (e.code === 'ARG_UNKNOWN_OPTION') {
				return this.log(e.message, true);
			}
			return this.log(e);
		}
		await this.handleRes();
	}
}
export { Command, BaseStore, chalk };
