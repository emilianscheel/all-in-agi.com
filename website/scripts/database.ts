const CONTAINER_NAME = 'all-in-agi-postgres';
const VOLUME_NAME = 'all-in-agi-postgres-data';
const IMAGE = 'postgres:17-alpine';

type ContainerInfo = {
	status?: string;
	configuration?: { id?: string };
};

function requiredEnv(name: string, fallback?: string) {
	const value = Bun.env[name] || fallback;
	if (!value) throw new Error(`${name} fehlt in .env.`);
	return value;
}

async function run(args: string[], capture = false) {
	const executable = Bun.which('container');
	if (!executable) {
		throw new Error('Apple container wurde nicht gefunden. Installieren Sie zuerst die container CLI.');
	}
	const process = Bun.spawn([executable, ...args], {
		stdin: 'ignore',
		stdout: capture ? 'pipe' : 'inherit',
		stderr: capture ? 'pipe' : 'inherit'
	});
	const exitCode = await process.exited;
	const stdout = capture ? await new Response(process.stdout).text() : '';
	const stderr = capture ? await new Response(process.stderr).text() : '';
	return { exitCode, stdout, stderr };
}

async function listContainers() {
	const result = await run(['ls', '--format', 'json', '--all'], true);
	if (result.exitCode !== 0) throw new Error(result.stderr.trim() || 'Container konnten nicht gelesen werden.');
	try {
		return JSON.parse(result.stdout) as ContainerInfo[];
	} catch {
		throw new Error('Die Ausgabe von Apple container konnte nicht gelesen werden.');
	}
}

async function ensureVolume() {
	const inspected = await run(['volume', 'inspect', VOLUME_NAME], true);
	if (inspected.exitCode === 0) return;
	const created = await run(['volume', 'create', VOLUME_NAME], true);
	if (created.exitCode !== 0) throw new Error(created.stderr.trim() || 'PostgreSQL-Volume konnte nicht erstellt werden.');
}

async function waitUntilReady(user: string, database: string) {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		const result = await run(['exec', CONTAINER_NAME, 'pg_isready', '-U', user, '-d', database], true);
		if (result.exitCode === 0) return;
		await Bun.sleep(500);
	}
	throw new Error('PostgreSQL wurde nicht innerhalb von 30 Sekunden bereit.');
}

export async function startDatabase() {
	const user = requiredEnv('POSTGRES_USER', 'all-in-agi');
	const password = requiredEnv('POSTGRES_PASSWORD', 'all-in-agi_local_dev');
	const database = requiredEnv('POSTGRES_DB', 'all-in-agi');
	const port = requiredEnv('POSTGRES_PORT', '5432');

	const system = await run(['system', 'start'], true);
	if (system.exitCode !== 0 && !/already|running/i.test(`${system.stdout} ${system.stderr}`)) {
		throw new Error(system.stderr.trim() || 'Apple container konnte nicht gestartet werden.');
	}

	const containers = await listContainers();
	const existing = containers.find((container) => container.configuration?.id === CONTAINER_NAME);
	if (!existing) {
		await ensureVolume();
		const created = await run([
			'run',
			'--detach',
			'--name', CONTAINER_NAME,
			'--env', `POSTGRES_USER=${user}`,
			'--env', `POSTGRES_PASSWORD=${password}`,
			'--env', `POSTGRES_DB=${database}`,
			'--env', 'PGDATA=/var/lib/postgresql/data/pgdata',
			'--publish', `127.0.0.1:${port}:5432`,
			'--volume', `${VOLUME_NAME}:/var/lib/postgresql/data`,
			IMAGE
		], true);
		if (created.exitCode !== 0) {
			throw new Error(created.stderr.trim() || `PostgreSQL konnte auf Port ${port} nicht gestartet werden.`);
		}
	} else if (existing.status !== 'running') {
		const started = await run(['start', CONTAINER_NAME], true);
		if (started.exitCode !== 0) throw new Error(started.stderr.trim() || 'PostgreSQL-Container konnte nicht gestartet werden.');
	}

	await waitUntilReady(user, database);
	console.log(`PostgreSQL ist auf 127.0.0.1:${port} bereit.`);
}

export async function stopDatabase() {
	const result = await run(['stop', CONTAINER_NAME], true);
	if (result.exitCode !== 0 && !/not found|no such/i.test(`${result.stdout} ${result.stderr}`)) {
		throw new Error(result.stderr.trim() || 'PostgreSQL-Container konnte nicht gestoppt werden.');
	}
	console.log('PostgreSQL wurde gestoppt.');
}

if (import.meta.main) {
	const action = Bun.argv[2];
	try {
		if (action === 'start') await startDatabase();
		else if (action === 'stop') await stopDatabase();
		else throw new Error('Verwendung: bun run scripts/database.ts <start|stop>');
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}
