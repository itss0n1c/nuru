import type { Nuru } from './index.js';

export type CommandResponse<T = Nuru> = (client: T, args: string[]) => Promise<string> | string | undefined;

export interface CmdInfo {
	name: string;
	description: string;
}

export class Command<T = Nuru> {
	name: string;
	description: string;
	#_response?: CommandResponse<T>;

	constructor(data: CmdInfo) {
		this.name = data.name;
		this.description = data.description;
	}

	set_handler(cb: CommandResponse<T>): this {
		this.#_response = cb;
		return this;
	}

	async handle(client: T, args: string[]): Promise<string | undefined> {
		if (!this.#_response) throw new Error('No response function provided');
		return this.#_response(client, args);
	}
}
