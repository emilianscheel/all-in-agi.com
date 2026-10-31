import { browser } from '$app/environment';
import { getAnalyticsConsent } from '$lib/analytics';
import { isAnalyticsPath } from '$lib/analytics-paths';

export type MetaPixelEvent = 'PageView' | 'Lead' | 'CompleteRegistration';

type MetaPixelParams = Record<string, string | number | boolean>;

type Fbq = ((...args: unknown[]) => void) & {
	callMethod?: (...args: unknown[]) => void;
	queue: unknown[];
	push: Fbq;
	loaded: boolean;
	version: string;
};

declare global {
	interface Window {
		fbq?: Fbq;
		_fbq?: Fbq;
	}
}

const SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

let pixelId = '';
let initialized = false;
let revoked = false;
let loader: Promise<void> | undefined;
let lastPageView = { signature: '', at: 0 };

export function configureMetaPixel(id: string | null | undefined) {
	if (!browser) return;
	const next = (id ?? '').trim();
	if (next === pixelId) return;
	pixelId = next;
	initialized = false;
}

export function disableMetaPixel() {
	if (!browser) return;
	revoked = true;
	initialized = false;
	if (window.fbq?.queue) window.fbq.queue.length = 0;
	for (const entry of document.cookie.split(';')) {
		const name = entry.trim().split('=')[0];
		if (name !== '_fbp' && name !== '_fbc') continue;
		const hostParts = location.hostname.split('.');
		const domains = ['', location.hostname, `.${location.hostname}`, ...(hostParts.length > 2 ? [hostParts.slice(-2).join('.'), `.${hostParts.slice(-2).join('.')}`] : [])];
		for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
	}
}

function canTrack(pathname: string) {
	return browser && getAnalyticsConsent() === 'granted' && Boolean(pixelId) && isAnalyticsPath(pathname);
}

function installFbqStub() {
	if (window.fbq) return;
	const fbq = function (...args: unknown[]) {
		if (revoked) return;
		if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
		else fbq.queue.push(args);
	} as Fbq;
	fbq.push = fbq;
	fbq.loaded = true;
	fbq.version = '2.0';
	fbq.queue = [];
	window.fbq = fbq;
	window._fbq ??= fbq;
}

function loadPixelScript() {
	if (!browser || !pixelId) return Promise.resolve();
	if (loader) return loader;
	installFbqStub();
	loader = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.async = true;
		script.src = SCRIPT_SRC;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Meta Pixel could not be loaded.'));
		const first = document.getElementsByTagName('script')[0];
		if (first?.parentNode) first.parentNode.insertBefore(script, first);
		else document.head.append(script);
	}).catch((error) => {
		loader = undefined;
		console.warn(error);
	});
	return loader;
}

function ensureInit() {
	if (!pixelId || initialized || !window.fbq) return;
	window.fbq('init', pixelId);
	initialized = true;
}

function trackPageView(pathname: string) {
	const signature = `${pathname}|${document.title}`;
	if (lastPageView.signature === signature && Date.now() - lastPageView.at < 1_000) return;
	lastPageView = { signature, at: Date.now() };
	window.fbq?.('track', 'PageView');
}

/** Load the pixel and send PageView for a public route. No-ops without consent or a pixel id. */
export function activateMetaPixel(pathname: string) {
	if (!canTrack(pathname)) return;
	revoked = false;
	installFbqStub();
	void loadPixelScript();
	ensureInit();
	trackPageView(pathname);
}

/** Standard Meta event. Queues through fbq and does not send contact fields. */
export function trackEvent(name: MetaPixelEvent, params: MetaPixelParams = {}) {
	if (!browser || !canTrack(location.pathname)) return;
	revoked = false;
	installFbqStub();
	void loadPixelScript();
	ensureInit();
	if (name === 'PageView') {
		trackPageView(location.pathname);
		return;
	}
	if (Object.keys(params).length) window.fbq?.('track', name, params);
	else window.fbq?.('track', name);
}
