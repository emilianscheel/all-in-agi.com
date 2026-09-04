import { PUBLIC_ID_PATTERN } from './public-id';
import { internalPathForPublic, stripLocale } from './i18n';

const PRIVATE_PREFIXES = ['/dashboard', '/verwalten', '/timer', '/clock', '/api'];

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
