import { Command, Nuru } from '../index.js';

const testDefaultCommand = new Command({
	name: 'test',
	description: 'a default test command',
}).set_handler((inst, args) => args.join(' '));

await new Nuru({
	args: {
		'-o': String,
		'-d': String,
	},
})
	.register_commands([testDefaultCommand])
	.handle();
