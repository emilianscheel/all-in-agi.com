import { PUBLIC_ID_PATTERN } from './public-id';
import { internalPathForPublic, stripLocale } from './i18n';

const PRIVATE_PREFIXES = ['/dashboard', '/verwalten', '/timer', '/clock', '/slides', '/api'];

/** Routes that can safely contribute anonymous marketing analytics. */
export function isAnalyticsPath(pathname: string) {
	const stripped = stripLocale(pathname);
	const normalized = stripped.locale ? (internalPathForPublic(stripped.pathname) ?? stripped.pathname) : pathname;
	if (PRIVATE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) return false;
	if (normalized === '/buchen/erfolg' || normalized === '/buchen') return true;
	if (normalized.startsWith('/buchen/')) return false; // encrypted shared-plan bearer URL
	if (PUBLIC_ID_PATTERN.test(normalized.slice(1))) return false; // booking bearer URL
	return true;
}

/** Never use a visitor-specific path in an Analytics event. */
export function sanitizeAnalyticsPath(pathname: string) {
	const stripped = stripLocale(pathname);
	const normalized = stripped.locale ? (internalPathForPublic(stripped.pathname) ?? stripped.pathname) : pathname;
	const prefix = stripped.locale ? `/${stripped.locale}` : '';
	if (normalized === '/buchen/erfolg' || normalized === '/buchen') return `${prefix}${normalized === '/buchen' ? '/go' : '/go/success'}`;
	if (normalized.startsWith('/buchen/')) return `${prefix}/go/:plan`;
	if (PUBLIC_ID_PATTERN.test(normalized.slice(1))) return `${prefix}/:booking`;
	return pathname;
}

/** Keep campaign attribution while excluding arbitrary query data from Analytics. */
export function analyticsPageLocation(origin: string, pathname: string, search: string) {
	const url = new URL(sanitizeAnalyticsPath(pathname), origin);
	const incoming = new URLSearchParams(search);
	for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_id']) {
		const value = incoming.get(key);
		if (value && /^[a-zA-Z0-9_-]{1,80}$/.test(value)) url.searchParams.set(key, value);
	}
	return url.toString();
}
