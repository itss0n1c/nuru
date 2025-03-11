import arg, { ArgError, type Result } from 'arg';
import chalk, { type ChalkInstance } from 'chalk';
import { version } from '../package.json';
import { help_cmd } from './cmds/index.js';
import type { Command, CommandResponseReturnType } from './command.js';

export interface NuruOptions {
	/** The name of the CLI */
	name: string;
	/** The current version */
	version: string;
	/** The accent color to use when printing some messages */
	accent: [number, number, number];
	/** The arguments to parse */
	args?: arg.Spec;
	/** The default command to run if none is provided */
	default_command?: string;
}

export class Nuru {
	name: string;
	version: string;
	/** An instance of Chalk that uses the accent color */
	accent: ChalkInstance;
	/** The registered commands */
	commands: Array<Command<this>>;
	/** The version of Nuru */
	nuru_version = version;
	protected _args: Result<arg.Spec>;

	constructor(opts: Partial<NuruOptions> = {}) {
		this.name = opts.name ?? 'Nuru';
		this.version = opts.version ?? '1.0.0';
		if (opts.accent) this.accent = chalk.rgb(opts.accent[0], opts.accent[1], opts.accent[2]);
		else this.accent = chalk.rgb(28, 119, 255);

		this.commands = [help_cmd()];

		const args: arg.Spec = {
			...opts.args,
			'--help': Boolean,
			'-h': '--help',
			'--version': Boolean,
			'-v': '--version',
		};

		try {
			this._args = arg(args);
		} catch (e) {
			if (e instanceof Error) {
				if (e instanceof ArgError && e.code === 'ARG_UNKNOWN_OPTION') this._error(e.message);
				else this._error(e);
			} else if (typeof e === 'string') this._error(e);
			else throw e;
			process.exit(1);
		}

		if (opts.default_command) this._args._ = [opts.default_command, ...this._args._];
	}

	protected _add_cmd(cmd: Command<this>) {
		if (this._find_cmd(cmd.name)) throw new Error(`Command \`${cmd.name}\` already registered!`);
		this.commands.push(cmd);
	}

	/** Register command(s) */
	register_commands(cmds: Command<this> | Array<Command<this>>): this {
		if (Array.isArray(cmds)) for (const cmd of cmds) this._add_cmd(cmd);
		else this._add_cmd(cmds);
		return this;
	}

	/** Log a message */
	async log(text: string, showTitle = false, title = false): Promise<void> {
		const str = `${showTitle ? this.accent(`[${this.name}${title ? ` ${text}` : ''}] `) : ''}${
			!title ? chalk.white(this._format_inline(text)) : `v${this.version}\n`
		}`;
		console.log(str);
	}

	protected _format_inline = (str: string) => str.replace(/`([^`]+)`/g, (_, m) => chalk.yellow(m));

	protected _error(_text: string | Error): void {
		let text = _text;
		if (typeof text !== 'string') text = text.message;
		const str = `${chalk.bgRgb(255, 0, 0)(chalk.rgb(255, 255, 255)('Error'))} ${chalk.white(
			this._format_inline(text),
		)}`;
		console.error(str);
	}

	protected _substr = (str: string, start: string, end: string) =>
		str.substring(str.indexOf(start) + 1, str.lastIndexOf(end));

	protected _find_cmd = (name: string) => this.commands.find((c) => c.name === name);

	protected _resolve_cmd_name() {
		if (this._args._[0]) return this._args._[0];
		if (this._args['--version']) return 'version';
		if (this._args['--help']) return 'help';
	}

	/** Run the CLI */
	async handle(): Promise<void> {
		const cmd_name = this._resolve_cmd_name();
		if (cmd_name === 'version') return console.log(this.version);
		if (!cmd_name) return this._error('No command provided!');
		const extraArgs = this._args._.slice(1, this._args._.length);
		const definedArgs = Object.keys(this._args)
			.filter((k) => k !== '_')
			.map((k) => `${k} ${this._args[k]}`);

		const args = [...definedArgs, ...extraArgs];
		const cmd = this._find_cmd(cmd_name);
		if (cmd) {
			let res: CommandResponseReturnType;
			try {
				res = await cmd.handle(this, args);
			} catch (e) {
				if (e instanceof Error) return this._error(e);
				if (typeof e === 'string') return this._error(e);
				throw e;
			}

			if (!res) return;
			return this.log(res);
		}
		return this._error(`Command \`${cmd_name}\` not found!`);
	}
}
export * from './command.js';
