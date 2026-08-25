import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { isAnalyticsPath, sanitizeAnalyticsPath } from '$lib/analytics-paths';

export type AnalyticsConsent = 'granted' | 'denied';

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		[key: `ga-disable-${string}`]: boolean | undefined;
	}
}

const CONSENT_KEY = 'all-in-agi.analytics-consent';
const CONSENT_CHANGE_EVENT = 'all-in-agi:analytics-consent-change';
const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
let loader: Promise<void> | undefined;
let lastPageView = { signature: '', at: 0 };

type StoredConsent = { value: AnalyticsConsent; expiresAt: number };

function measurementId() {
	return (env.PUBLIC_GA_MEASUREMENT_ID ?? '').trim();
}

function emitConsentChange() {
	if (browser) window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

function disableGoogleAnalytics() {
	const id = measurementId();
	if (browser && id) window[`ga-disable-${id}`] = true;
}

function enableGoogleAnalytics() {
	const id = measurementId();
	if (browser && id) window[`ga-disable-${id}`] = false;
}

function deleteAnalyticsCookies() {
	if (!browser) return;
	for (const entry of document.cookie.split(';')) {
		const name = entry.trim().split('=')[0];
		if (!/^_(?:ga|gid|gat)|^_gcl_/i.test(name)) continue;
		const hostParts = location.hostname.split('.');
		const domains = ['', location.hostname, `.${location.hostname}`, ...(hostParts.length > 2 ? [hostParts.slice(-2).join('.'), `.${hostParts.slice(-2).join('.')}`] : [])];
		for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
	}
}

function storedConsent(): StoredConsent | null {
	if (!browser) return null;
	try {
		const value = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null') as StoredConsent | null;
		if (!value || (value.value !== 'granted' && value.value !== 'denied') || value.expiresAt <= Date.now()) {
			localStorage.removeItem(CONSENT_KEY);
			return null;
		}
		return value;
	} catch {
		return null;
	}
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
	return storedConsent()?.value ?? null;
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
	if (!browser) return;
	try {
		localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, expiresAt: Date.now() + CONSENT_MAX_AGE_MS } satisfies StoredConsent));
	} catch {
		// The banner remains usable when browser storage is unavailable.
	}
	if (value === 'denied') {
		disableGoogleAnalytics();
		deleteAnalyticsCookies();
	}
	emitConsentChange();
}

export function openCookieSettings() {
	if (!browser) return;
	try { localStorage.removeItem(CONSENT_KEY); } catch { /* storage is optional */ }
	disableGoogleAnalytics();
	deleteAnalyticsCookies();
	emitConsentChange();
}

function gtag(...args: unknown[]) {
	window.gtag?.(...args);
}

function safePageLocation(pathname: string) {
	return `${location.origin}${sanitizeAnalyticsPath(pathname)}`;
}

function loadGoogleAnalytics() {
	const id = measurementId();
	if (!browser || !id) return Promise.resolve();
	if (loader) return loader;

	enableGoogleAnalytics();
	window.dataLayer ??= [];
	window.gtag ??= (...args: unknown[]) => window.dataLayer?.push(args);
	gtag('js', new Date());
	gtag('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });

	loader = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Google Analytics could not be loaded.'));
		document.head.append(script);
	}).catch((error) => {
		loader = undefined;
		console.warn(error);
	});
	return loader;
}

function trackPageView(pathname: string) {
	const id = measurementId();
	if (!id || !isAnalyticsPath(pathname)) return;
	const signature = `${pathname}|${document.title}`;
	if (lastPageView.signature === signature && Date.now() - lastPageView.at < 1_000) return;
	lastPageView = { signature, at: Date.now() };
	const pageLocation = safePageLocation(pathname);
	gtag('config', id, { page_location: pageLocation, page_path: sanitizeAnalyticsPath(pathname), page_title: document.title, send_page_view: false });
	gtag('event', 'page_view', { page_location: pageLocation, page_path: sanitizeAnalyticsPath(pathname), page_title: document.title });
}

export async function activateAnalyticsForPath(pathname: string) {
	if (!browser || getAnalyticsConsent() !== 'granted' || !measurementId()) return;
	if (!isAnalyticsPath(pathname)) {
		disableGoogleAnalytics();
		deleteAnalyticsCookies();
		return;
	}
	enableGoogleAnalytics();
	await loadGoogleAnalytics();
	trackPageView(pathname);
}

export function trackAnalyticsEvent(name: string, parameters: Record<string, string | number | boolean> = {}) {
	if (!browser || getAnalyticsConsent() !== 'granted' || !measurementId() || !isAnalyticsPath(location.pathname)) return;
	enableGoogleAnalytics();
	gtag('event', name, parameters);
}

export function installBookingCtaTracking() {
	if (!browser) return () => {};
	const onClick = (event: MouseEvent) => {
		if (!(event.target instanceof Element)) return;
		const cta = event.target.closest<HTMLElement>('[data-analytics-event="booking_cta"]');
		if (cta) trackAnalyticsEvent('booking_cta_click', { placement: cta.dataset.analyticsPlacement ?? 'unknown' });
	};
	document.addEventListener('click', onClick);
	return () => document.removeEventListener('click', onClick);
}
