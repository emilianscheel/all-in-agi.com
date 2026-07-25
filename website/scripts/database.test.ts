import { describe, expect, test } from 'bun:test';
import { databaseConfigFromUrl } from './database';

describe('database URL configuration', () => {
	test('derives the complete local container configuration from DATABASE_URL', () => {
		expect(databaseConfigFromUrl('postgresql://app:secret@127.0.0.1:5544/bookings')).toEqual({
			url: new URL('postgresql://app:secret@127.0.0.1:5544/bookings'),
			isLocal: true,
			user: 'app',
			password: 'secret',
			database: 'bookings',
			port: '5544'
		});
	});

	test('uses PostgreSQL default port for local URLs without a port', () => {
		expect(databaseConfigFromUrl('postgres://app:secret@localhost/bookings').port).toBe('5432');
	});

	test('leaves external database URLs untouched and skips local provisioning', () => {
		const config = databaseConfigFromUrl('postgresql://app:secret@database.example.com:5432/bookings?sslmode=require');
		expect(config.isLocal).toBe(false);
		expect(config.url.toString()).toBe('postgresql://app:secret@database.example.com:5432/bookings?sslmode=require');
	});

	test('rejects missing, malformed, and incomplete local URLs', () => {
		expect(() => databaseConfigFromUrl(undefined)).toThrow('DATABASE_URL fehlt');
		expect(() => databaseConfigFromUrl('not-a-url')).toThrow('keine gültige URL');
		expect(() => databaseConfigFromUrl('mysql://app:secret@localhost/bookings')).toThrow('postgres://');
		expect(() => databaseConfigFromUrl('postgresql://localhost/bookings')).toThrow('Benutzername, Passwort und Datenbankname');
	});
});
