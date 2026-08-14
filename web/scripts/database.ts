const CONTAINER_NAME = 'all-in-agi-postgres';
const VOLUME_NAME = 'all-in-agi-postgres-data';
const IMAGE = 'postgres:17-alpine';

type ContainerInfo = {
	status?: string;
	configuration?: { id?: string };
};

export type DatabaseUrlConfig =
	| { url: URL; isLocal: false }
	| { url: URL; isLocal: true; user: string; password: string; database: string; port: string };

function decodedUrlPart(value: string, label: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		throw new Error(`${label} in DATABASE_URL ist ungültig kodiert.`);
	}
}

export function databaseConfigFromUrl(value: string | undefined): DatabaseUrlConfig {
	if (!value) throw new Error('DATABASE_URL fehlt in .env.');

	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error('DATABASE_URL ist keine gültige URL.');
	}
	if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
		throw new Error('DATABASE_URL muss mit postgres:// oder postgresql:// beginnen.');
	}

	const isLocal = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
	if (!isLocal) return { url, isLocal };

	const user = decodedUrlPart(url.username, 'Der Benutzername');
	const password = decodedUrlPart(url.password, 'Das Passwort');
	const database = decodedUrlPart(url.pathname.replace(/^\/+/, ''), 'Der Datenbankname');
	const port = url.port || '5432';
	if (!user || !password || !database) {
		throw new Error('Lokale DATABASE_URL muss Benutzername, Passwort und Datenbankname enthalten.');
	}
	const numericPort = Number(port);
	if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65_535) {
		throw new Error('Der Port in DATABASE_URL ist ungültig.');
	}

	return { url, isLocal, user, password, database, port };
}

export function databaseUrlForMigrations(value: string | undefined) {
	const url = new URL(databaseConfigFromUrl(value).url);
	const minimumMessageLevel = '-c client_min_messages=warning';
	const currentOptions = url.searchParams.get('options')?.trim();
	if (!currentOptions?.includes('client_min_messages=warning')) {
		url.searchParams.set('options', currentOptions ? `${currentOptions} ${minimumMessageLevel}` : minimumMessageLevel);
	}
	return url.toString();
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
	const config = databaseConfigFromUrl(Bun.env.DATABASE_URL);
	if (!config.isLocal) {
		console.log(`DATABASE_URL verwendet ${config.url.hostname}; der lokale PostgreSQL-Start wird übersprungen.`);
		return;
	}
	const { user, password, database, port } = config;

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
