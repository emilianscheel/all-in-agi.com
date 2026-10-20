type IconLoader = () => Promise<string>;

let iconModules: Record<string, IconLoader> = {};
try {
	iconModules = import.meta.glob('../../node_modules/lucide-static/icons/*.svg', {
		query: '?raw',
		import: 'default'
	}) as Record<string, IconLoader>;
} catch {
	iconModules = {};
}

const iconDirectory = new URL('../../node_modules/lucide-static/icons/', import.meta.url);
const svgCache = new Map<string, Promise<string | null>>();

export const LUCIDE_ICON_NAMES = Object.keys(iconModules)
	.map((path) => path.split('/').pop()?.replace(/\.svg$/, '') ?? '')
	.filter((name) => /^[a-z0-9-]+$/.test(name))
	.sort();

export function lucideIconSvg(name: string) {
	const file = name.trim().toLowerCase();
	if (!/^[a-z0-9-]+$/.test(file)) return Promise.resolve(null);
	const cached = svgCache.get(file);
	if (cached) return cached;
	const pending = loadLucideIconSvg(file).catch((error: unknown) => {
		svgCache.delete(file);
		throw error;
	});
	svgCache.set(file, pending);
	return pending;
}

async function loadLucideIconSvg(file: string) {
	const key = Object.keys(iconModules).find((path) => path.endsWith(`/${file}.svg`));
	if (key) {
		const svg = await iconModules[key]();
		return typeof svg === 'string' && svg.includes('<svg') ? svg : null;
	}
	try {
		const path = new URL(`${file}.svg`, iconDirectory);
		if (typeof Bun !== 'undefined') {
			const handle = Bun.file(path);
			if (!(await handle.exists())) return null;
			const svg = await handle.text();
			return svg.includes('<svg') ? svg : null;
		}
		const { readFile } = await import('node:fs/promises');
		const svg = await readFile(path, 'utf8');
		return svg.includes('<svg') ? svg : null;
	} catch {
		return null;
	}
}
