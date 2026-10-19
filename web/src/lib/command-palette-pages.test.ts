import { describe, expect, test } from 'bun:test';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
	COMMAND_PALETTE_EXCLUDED_PATHS,
	commandPalettePagePaths,
	getCommandPalettePages
} from './command-palette-pages';

const ROUTES_DIR = join(import.meta.dir, '../routes');

function collectStaticPagePaths(dir = ROUTES_DIR, prefix = ''): string[] {
	const entries = readdirSync(dir);
	const paths: string[] = [];

	if (entries.includes('+page.svelte')) {
		paths.push(prefix || '/');
	}

	for (const entry of entries) {
		if (entry.startsWith('+') || entry.startsWith('.') || entry === 'api') continue;
		const full = join(dir, entry);
		if (!statSync(full).isDirectory()) continue;
		// Skip dynamic segments — not enumerable in the palette.
		if (entry.startsWith('[') && entry.endsWith(']')) continue;
		paths.push(...collectStaticPagePaths(full, `${prefix}/${entry}`));
	}

	return paths;
}

describe('command palette pages', () => {
	test('excludes offer routes', () => {
		const paths = commandPalettePagePaths();
		for (const excluded of COMMAND_PALETTE_EXCLUDED_PATHS) {
			expect(paths).not.toContain(excluded);
		}
		expect(paths.some((path) => path.startsWith('/offer'))).toBe(false);
	});

	test('includes every static page except offer', () => {
		const catalog = new Set(commandPalettePagePaths());
		const excluded = new Set<string>(COMMAND_PALETTE_EXCLUDED_PATHS);
		const staticPaths = collectStaticPagePaths().filter((path) => !excluded.has(path));

		for (const path of staticPaths) {
			expect(catalog.has(path)).toBe(true);
		}
	});

	test('localizes hrefs', () => {
		const de = getCommandPalettePages('de');
		const en = getCommandPalettePages('en');
		const homeDe = de.find((page) => page.id === 'home');
		const homeEn = en.find((page) => page.id === 'home');
		expect(homeDe?.href).toBe('/de');
		expect(homeEn?.href).toBe('/en');
		expect(homeDe?.title).toBe('Startseite');
		expect(homeEn?.title).toBe('Home');
	});

	test('gtm pages keep icons and groups', () => {
		const pages = getCommandPalettePages('de');
		const berlin = pages.find((page) => page.id === 'gtm-hackathon-unternehmen-berlin');
		expect(berlin).toBeDefined();
		expect(berlin?.path).toBe('/hackathon-unternehmen-berlin');
		expect(berlin?.group).toBeTruthy();
		expect(berlin?.icon).toBeDefined();
		expect(berlin?.href.startsWith('/de/')).toBe(true);
	});
});
