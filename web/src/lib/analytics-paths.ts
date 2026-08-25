import { PUBLIC_ID_PATTERN } from './public-id';

const PRIVATE_PREFIXES = ['/dashboard', '/verwalten', '/timer', '/clock', '/api'];

/** Routes that can safely contribute anonymous marketing analytics. */
export function isAnalyticsPath(pathname: string) {
	if (PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
	if (pathname === '/buchen/erfolg' || pathname === '/buchen') return true;
	if (pathname.startsWith('/buchen/')) return false; // encrypted shared-plan bearer URL
	if (PUBLIC_ID_PATTERN.test(pathname.slice(1))) return false; // booking bearer URL
	return true;
}

/** Never use a visitor-specific path in an Analytics event. */
export function sanitizeAnalyticsPath(pathname: string) {
	if (pathname === '/buchen/erfolg' || pathname === '/buchen') return pathname;
	if (pathname.startsWith('/buchen/')) return '/buchen/:plan';
	if (PUBLIC_ID_PATTERN.test(pathname.slice(1))) return '/:booking';
	return pathname;
}
