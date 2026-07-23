import { startDatabase } from './database';

async function run(command: string[]) {
	const process = Bun.spawn(command, {
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit'
	});
	const exitCode = await process.exited;
	if (exitCode !== 0) process.exit(exitCode);
}

try {
	await startDatabase();
	await run(['bun', 'run', 'db:migrate']);
	await run(['bun', 'run', 'dev:web']);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
