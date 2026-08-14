import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

let client: Sql | undefined;
let database: PostgresJsDatabase<typeof schema> | undefined;

export async function getDb() {
	if (database) return database;
	const { env } = await import('$env/dynamic/private');
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL ist nicht konfiguriert.');
	client = postgres(env.DATABASE_URL, { max: 10 });
	database = drizzle(client, { schema });
	return database;
}
