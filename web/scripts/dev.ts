import { databaseUrlForMigrations, startDatabase } from './database';

async function run(command: string[], env?: Record<string, string | undefined>) {
	const child = Bun.spawn(command, {
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
		env
	});
	const exitCode = await child.exited;
	if (exitCode !== 0) globalThis.process.exit(exitCode);
}

try {
	await startDatabase();
	await run(['bun', 'run', 'db:migrate'], {
		...Bun.env,
		DATABASE_URL: databaseUrlForMigrations(Bun.env.DATABASE_URL)
	});
	await run(['bun', 'run', 'dev:web']);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
