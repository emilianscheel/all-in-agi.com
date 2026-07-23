import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

let client: Sql | undefined;
let database: PostgresJsDatabase<typeof schema> | undefined;

export function getDb() {
	if (database) return database;
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ist nicht konfiguriert.');
	client = postgres(process.env.DATABASE_URL, { max: 10 });
	database = drizzle(client, { schema });
	return database;
}
