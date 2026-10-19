import { CONTACT_EMAIL, CONTACT_PHONE_HREF } from './contact';

export const EMAIL_SIGNATURE_NAME = 'Emilian Scheel';
export const EMAIL_SIGNATURE_PHONE_DISPLAY = '0152 57 25 7750';
export const EMAIL_SITE_LABEL = 'all-in-agi.com';
export const EMAIL_SITE_URL = 'https://all-in-agi.com';

export function emailSignatureText(locale: 'de' | 'en' = 'de') {
	const closing = locale === 'en' ? 'Best regards' : 'Viele Grüße';
	return [
		closing,
		EMAIL_SIGNATURE_NAME,
		'',
		`${EMAIL_SITE_LABEL} (${EMAIL_SITE_URL})`,
		CONTACT_EMAIL,
		EMAIL_SIGNATURE_PHONE_DISPLAY
	];
}

export function emailSignatureHtml(locale: 'de' | 'en' = 'de') {
	const closing = locale === 'en' ? 'Best regards' : 'Viele Grüße';
	return `<p>${closing}<br>${EMAIL_SIGNATURE_NAME}</p><p><a href="${EMAIL_SITE_URL}">${EMAIL_SITE_LABEL}</a><br><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a><br><a href="tel:${CONTACT_PHONE_HREF}">${EMAIL_SIGNATURE_PHONE_DISPLAY}</a></p>`;
}
