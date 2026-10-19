import type { Locale } from './i18n';

export function localeMessage(locale: Locale | undefined, de: string, en: string) {
	return locale === 'en' ? en : de;
}
